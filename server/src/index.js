import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

const PORT = Number(process.env.PORT || 8787);
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const clean = (value = '') => String(value)
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\([^)]*(official|audio|video|lyrics?|remaster(ed)?)[^)]*\)/gi, '')
  .replace(/\[[^\]]*(official|audio|video|lyrics?|remaster(ed)?)[^\]]*\]/gi, '')
  .replace(/[^a-z0-9ığüşöç\s]/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const fingerprint = t => t.isrc ? `isrc:${String(t.isrc).toUpperCase()}` : `${clean(t.artist)}|${clean(t.title)}`;

function dedupe(items) {
  const map = new Map();
  for (const item of items) {
    const key = fingerprint(item);
    const old = map.get(key);
    if (!old || (!old.streamUrl && item.streamUrl)) map.set(key, item);
  }
  return [...map.values()];
}

async function timedFetch(url, options = {}, ms = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

async function musicBrainz(q) {
  const r = await timedFetch(`https://musicbrainz.org/ws/2/recording?query=${encodeURIComponent(q)}&fmt=json&limit=25`, {
    headers: { 'User-Agent': 'Ritim/0.2 personal-android-client', Accept: 'application/json' }
  });
  if (!r.ok) throw new Error(`MusicBrainz ${r.status}`);
  const j = await r.json();
  return (j.recordings || []).map(x => ({
    id: `mb:${x.id}`, source: 'musicbrainz', title: x.title,
    artist: x['artist-credit']?.map(a => a.name).join('') || 'Bilinmeyen sanatçı',
    album: x.releases?.[0]?.title, duration: x.length ? Math.round(x.length / 1000) : undefined,
    isrc: x.isrcs?.[0]
  }));
}

async function openverse(q) {
  const r = await timedFetch(`https://api.openverse.org/v1/audio/?q=${encodeURIComponent(q)}&page_size=25`);
  if (!r.ok) throw new Error(`Openverse ${r.status}`);
  const j = await r.json();
  return (j.results || []).map(x => ({
    id: `ov:${x.id}`, source: 'openverse', title: x.title || 'İsimsiz parça',
    artist: x.creator || 'Bilinmeyen sanatçı', artworkUrl: x.thumbnail || undefined,
    streamUrl: x.url || x.audio_url || undefined, duration: typeof x.duration === 'number' ? Math.round(x.duration) : undefined,
    license: x.license ? `${x.license}${x.license_version ? ` ${x.license_version}` : ''}` : undefined
  }));
}

async function archive(q) {
  const params = new URLSearchParams({ q: `mediatype:audio AND (${q})`, fl: 'identifier,title,creator', rows: '10', output: 'json' });
  const r = await timedFetch(`https://archive.org/advancedsearch.php?${params}`);
  if (!r.ok) throw new Error(`Archive ${r.status}`);
  const j = await r.json();
  const docs = j.response?.docs || [];
  const settled = await Promise.allSettled(docs.map(async d => {
    const mr = await timedFetch(`https://archive.org/metadata/${encodeURIComponent(d.identifier)}`);
    if (!mr.ok) return null;
    const m = await mr.json();
    const audio = (m.files || []).find(f => typeof f.name === 'string' && /\.(mp3|m4a|ogg)$/i.test(f.name) && !/64kb|spectrogram|thumb/i.test(f.name));
    if (!audio) return null;
    return {
      id: `ia:${d.identifier}:${audio.name}`, source: 'internetarchive',
      title: m.metadata?.title || d.title || audio.title || d.identifier,
      artist: m.metadata?.creator || d.creator || 'Bilinmeyen sanatçı', album: m.metadata?.album || undefined,
      artworkUrl: `https://archive.org/download/${encodeURIComponent(d.identifier)}/__ia_thumb.jpg`,
      streamUrl: `https://archive.org/download/${encodeURIComponent(d.identifier)}/${encodeURIComponent(audio.name)}`,
      duration: audio.length ? Math.round(Number(audio.length)) : undefined,
      license: m.metadata?.licenseurl || m.metadata?.rights || undefined
    };
  }));
  return settled.flatMap(x => x.status === 'fulfilled' && x.value ? [x.value] : []);
}

app.get('/health', async () => ({ ok: true, service: 'ritim-server', now: Date.now() }));

app.get('/v1/search', async (req, reply) => {
  const q = String(req.query?.q || '').trim();
  if (q.length < 2) return reply.code(400).send({ error: 'En az 2 karakter gir.' });
  const key = clean(q);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL) return { ...hit.payload, cached: true };

  const settled = await Promise.allSettled([openverse(q), archive(q), musicBrainz(q)]);
  const errors = [];
  const all = [];
  for (const x of settled) {
    if (x.status === 'fulfilled') all.push(...x.value);
    else errors.push(x.reason instanceof Error ? x.reason.message : String(x.reason));
  }
  const tracks = dedupe(all).sort((a,b) => Number(!!b.streamUrl) - Number(!!a.streamUrl));
  const payload = { query: q, total: tracks.length, tracks, partialErrors: errors };
  cache.set(key, { at: Date.now(), payload });
  return payload;
});

app.get('/v1/lyrics', async (req, reply) => {
  const { track, artist, album, duration } = req.query || {};
  if (!track || !artist) return reply.code(400).send({ error: 'track ve artist gerekli.' });
  const p = new URLSearchParams({ track_name: String(track), artist_name: String(artist) });
  if (album) p.set('album_name', String(album));
  if (duration) p.set('duration', String(duration));
  const r = await timedFetch(`https://lrclib.net/api/get?${p}`);
  if (r.status === 404) return reply.code(404).send({ error: 'Söz bulunamadı.' });
  if (!r.ok) return reply.code(502).send({ error: 'LRCLIB hatası.' });
  return r.json();
});

app.get('/v1/radio', async (req, reply) => {
  const q = String(req.query?.q || 'Turkey');
  const r = await timedFetch(`https://de1.api.radio-browser.info/json/stations/search?name=${encodeURIComponent(q)}&hidebroken=true&limit=50&order=clickcount&reverse=true`, {
    headers: { 'User-Agent': 'Ritim/0.2' }
  });
  if (!r.ok) return reply.code(502).send({ error: 'Radyo servisi erişilemiyor.' });
  const j = await r.json();
  return j.filter(x => x.url_resolved || x.url).map(x => ({
    id: x.stationuuid, name: x.name || 'İsimsiz radyo', streamUrl: x.url_resolved || x.url,
    favicon: x.favicon || undefined, country: x.country || undefined,
    tags: typeof x.tags === 'string' ? x.tags.split(',').filter(Boolean) : []
  }));
});

app.listen({ port: PORT, host: '0.0.0.0' }).catch(err => { app.log.error(err); process.exit(1); });
