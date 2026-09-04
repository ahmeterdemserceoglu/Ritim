import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import {searchSources} from './sources.js';
import {artistSearch,releaseGroups,releaseGroupTracks} from './catalog.js';

const app=Fastify({logger:true});
await app.register(cors,{origin:true});
await app.register(rateLimit,{max:180,timeWindow:'1 minute'});
const PORT=Number(process.env.PORT||8787),startedAt=Date.now(),cache=new Map(),TTL=5*60*1000;
const key=s=>String(s).trim().toLowerCase();
async function cached(k,producer){const hit=cache.get(k);if(hit&&Date.now()-hit.at<TTL)return{...hit.value,cached:true};const value=await producer();cache.set(k,{at:Date.now(),value});return value}

app.get('/health',async()=>({ok:true,service:'ritim-server',version:'0.4',uptimeSeconds:Math.floor((Date.now()-startedAt)/1000),cacheEntries:cache.size,now:Date.now()}));
app.get('/v1/search',async(req,reply)=>{const q=String(req.query?.q||'').trim();if(q.length<2)return reply.code(400).send({error:'En az 2 karakter gir.'});return cached(`search:${key(q)}`,async()=>{const result=await searchSources(q);return{query:q,total:result.tracks.length,tracks:result.tracks,partialErrors:result.errors}})});
app.get('/v1/resolve',async(req,reply)=>{const q=String(req.query?.q||'').trim();if(q.length<2)return reply.code(400).send({error:'q gerekli'});const result=await searchSources(q);const candidates=result.tracks.filter(x=>x.streamUrl);return{query:q,best:candidates[0]||null,candidates:candidates.slice(0,12)}});
app.get('/v1/artist',async(req,reply)=>{const name=String(req.query?.name||'').trim();if(!name)return reply.code(400).send({error:'name gerekli'});return{artists:await cached(`artist:${key(name)}`,()=>artistSearch(name))}});
app.get('/v1/releases',async(req,reply)=>{const id=String(req.query?.artistId||'').trim();if(!id)return reply.code(400).send({error:'artistId gerekli'});return{releases:await cached(`releases:${id}`,()=>releaseGroups(id))}});
app.get('/v1/release-tracks',async(req,reply)=>{const id=String(req.query?.id||'').trim();if(!id)return reply.code(400).send({error:'id gerekli'});return{tracks:await cached(`release:${id}`,()=>releaseGroupTracks(id))}});
app.get('/v1/lyrics',async(req,reply)=>{const{track,artist,album,duration}=req.query||{};if(!track||!artist)return reply.code(400).send({error:'track ve artist gerekli'});const p=new URLSearchParams({track_name:String(track),artist_name:String(artist)});if(album)p.set('album_name',String(album));if(duration)p.set('duration',String(duration));const r=await fetch(`https://lrclib.net/api/get?${p}`);if(r.status===404)return reply.code(404).send({error:'Söz bulunamadı.'});if(!r.ok)return reply.code(502).send({error:'LRCLIB hatası.'});return r.json()});
app.get('/v1/radio',async(req,reply)=>{const q=String(req.query?.q||'Turkey');const r=await fetch(`https://de1.api.radio-browser.info/json/stations/search?name=${encodeURIComponent(q)}&hidebroken=true&limit=50&order=clickcount&reverse=true`,{headers:{'User-Agent':'Ritim/0.4'}});if(!r.ok)return reply.code(502).send({error:'Radyo servisi erişilemiyor.'});const j=await r.json();return j.filter(x=>x.url_resolved||x.url).map(x=>({id:x.stationuuid,name:x.name||'İsimsiz radyo',streamUrl:x.url_resolved||x.url,favicon:x.favicon||undefined,country:x.country||undefined,codec:x.codec||undefined,bitrate:x.bitrate||undefined,tags:typeof x.tags==='string'?x.tags.split(',').filter(Boolean):[]}))});
app.get('/v1/cache/stats',async()=>({entries:cache.size,ttlMs:TTL}));
app.listen({port:PORT,host:'0.0.0.0'}).catch(err=>{app.log.error(err);process.exit(1)});
