import { Directory, File, Paths } from 'expo-file-system';
import type { Track } from '@/types/music';
import { trackFingerprint } from '@/lib/dedupe';
import * as SQLite from 'expo-sqlite';

const downloadDir = new Directory(Paths.document, 'ritim-downloads');

async function ensureDir() {
  if (!downloadDir.exists) downloadDir.create();
}

export async function downloadTrack(track: Track) {
  if (!track.streamUrl) throw new Error('Bu parça indirilemiyor.');
  await ensureDir();

  const fingerprint = trackFingerprint(track);
  const safeName = fingerprint.replace(/[^a-z0-9_-]/gi, '_').slice(0, 100);
  const target = new File(downloadDir, `${safeName}.audio`);
  if (target.exists) target.delete();

  const downloaded = await File.downloadFileAsync(track.streamUrl, target, { idempotent: true });
  const db = await SQLite.openDatabaseAsync('ritim.db');
  await db.runAsync(
    `INSERT INTO downloads(fingerprint,track_json,local_uri,bytes,created_at)
     VALUES(?,?,?,?,?)
     ON CONFLICT(fingerprint) DO UPDATE SET track_json=excluded.track_json, local_uri=excluded.local_uri, bytes=excluded.bytes, created_at=excluded.created_at`,
    fingerprint,
    JSON.stringify(track),
    downloaded.uri,
    downloaded.size ?? 0,
    Date.now()
  );
  return downloaded.uri;
}

export async function removeDownload(track: Track) {
  const fingerprint = trackFingerprint(track);
  const db = await SQLite.openDatabaseAsync('ritim.db');
  const row = await db.getFirstAsync<{ local_uri: string }>('SELECT local_uri FROM downloads WHERE fingerprint=?', fingerprint);
  if (row?.local_uri) {
    try {
      const file = new File(row.local_uri);
      if (file.exists) file.delete();
    } catch {}
  }
  await db.runAsync('DELETE FROM downloads WHERE fingerprint=?', fingerprint);
}

export async function resolvePlayableUri(track: Track): Promise<string | undefined> {
  const fingerprint = trackFingerprint(track);
  const db = await SQLite.openDatabaseAsync('ritim.db');
  const row = await db.getFirstAsync<{ local_uri: string }>('SELECT local_uri FROM downloads WHERE fingerprint=?', fingerprint);
  if (row?.local_uri) {
    try {
      if (new File(row.local_uri).exists) return row.local_uri;
    } catch {}
  }
  return track.streamUrl;
}
