import * as SQLite from 'expo-sqlite';
import type { Track } from '@/types/music';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
const db = () => dbPromise ??= SQLite.openDatabaseAsync('ritim.db');

export async function initDatabase() {
  const database = await db();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS favorites (
      fingerprint TEXT PRIMARY KEY,
      track_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fingerprint TEXT NOT NULL,
      track_json TEXT NOT NULL,
      played_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS history_played_idx ON history(played_at DESC);
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id TEXT NOT NULL,
      fingerprint TEXT NOT NULL,
      track_json TEXT NOT NULL,
      position INTEGER NOT NULL,
      PRIMARY KEY (playlist_id, fingerprint),
      FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS downloads (
      fingerprint TEXT PRIMARY KEY,
      track_json TEXT NOT NULL,
      local_uri TEXT NOT NULL,
      bytes INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export async function setState(key: string, value: unknown) {
  const database = await db();
  await database.runAsync(
    `INSERT INTO app_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    key,
    JSON.stringify(value)
  );
}

export async function getState<T>(key: string): Promise<T | null> {
  const database = await db();
  const row = await database.getFirstAsync<{ value: string }>('SELECT value FROM app_state WHERE key=?', key);
  return row ? JSON.parse(row.value) as T : null;
}

export async function addHistory(fingerprint: string, track: Track) {
  const database = await db();
  await database.runAsync(
    'INSERT INTO history(fingerprint,track_json,played_at) VALUES(?,?,?)',
    fingerprint,
    JSON.stringify(track),
    Date.now()
  );
  await database.runAsync(`DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY played_at DESC LIMIT 500)`);
}

export async function listHistory(limit = 100): Promise<Track[]> {
  const database = await db();
  const rows = await database.getAllAsync<{ track_json: string }>('SELECT track_json FROM history ORDER BY played_at DESC LIMIT ?', limit);
  return rows.map(r => JSON.parse(r.track_json));
}

export async function toggleFavorite(fingerprint: string, track: Track): Promise<boolean> {
  const database = await db();
  const existing = await database.getFirstAsync('SELECT fingerprint FROM favorites WHERE fingerprint=?', fingerprint);
  if (existing) {
    await database.runAsync('DELETE FROM favorites WHERE fingerprint=?', fingerprint);
    return false;
  }
  await database.runAsync('INSERT INTO favorites(fingerprint,track_json,created_at) VALUES(?,?,?)', fingerprint, JSON.stringify(track), Date.now());
  return true;
}

export async function listFavorites(): Promise<Track[]> {
  const database = await db();
  const rows = await database.getAllAsync<{ track_json: string }>('SELECT track_json FROM favorites ORDER BY created_at DESC');
  return rows.map(r => JSON.parse(r.track_json));
}
