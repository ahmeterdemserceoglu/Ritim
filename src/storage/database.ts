import * as SQLite from 'expo-sqlite';
import type {Track} from '@/types/music';

let dbPromise: Promise<SQLite.SQLiteDatabase>|null=null;
const db=()=>dbPromise??=SQLite.openDatabaseAsync('ritim.db');

export async function initDatabase(){
 const database=await db();
 await database.execAsync(`
 PRAGMA journal_mode=WAL;
 PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS favorites(fingerprint TEXT PRIMARY KEY,track_json TEXT NOT NULL,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS history(id INTEGER PRIMARY KEY AUTOINCREMENT,fingerprint TEXT NOT NULL,track_json TEXT NOT NULL,played_at INTEGER NOT NULL,seconds_played INTEGER DEFAULT 0,completed INTEGER DEFAULT 0,skipped INTEGER DEFAULT 0);
 CREATE INDEX IF NOT EXISTS history_played_idx ON history(played_at DESC);
 CREATE TABLE IF NOT EXISTS playlists(id TEXT PRIMARY KEY,name TEXT NOT NULL,kind TEXT NOT NULL DEFAULT 'manual',rule_json TEXT,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS playlist_tracks(playlist_id TEXT NOT NULL,fingerprint TEXT NOT NULL,track_json TEXT NOT NULL,position INTEGER NOT NULL,PRIMARY KEY(playlist_id,fingerprint),FOREIGN KEY(playlist_id) REFERENCES playlists(id) ON DELETE CASCADE);
 CREATE TABLE IF NOT EXISTS downloads(fingerprint TEXT PRIMARY KEY,track_json TEXT NOT NULL,local_uri TEXT NOT NULL,bytes INTEGER DEFAULT 0,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS app_state(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS blocked(kind TEXT NOT NULL,value TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(kind,value));
 CREATE TABLE IF NOT EXISTS search_history(query TEXT PRIMARY KEY,last_used INTEGER NOT NULL,use_count INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS search_cache(cache_key TEXT PRIMARY KEY,payload TEXT NOT NULL,expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS track_stats(fingerprint TEXT PRIMARY KEY,track_json TEXT NOT NULL,plays INTEGER NOT NULL DEFAULT 0,completed INTEGER NOT NULL DEFAULT 0,skips INTEGER NOT NULL DEFAULT 0,total_seconds INTEGER NOT NULL DEFAULT 0,last_played INTEGER NOT NULL DEFAULT 0);
 `);
}

export async function setState(key:string,value:unknown){const d=await db();await d.runAsync(`INSERT INTO app_state(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,key,JSON.stringify(value));}
export async function getState<T>(key:string):Promise<T|null>{const d=await db();const r=await d.getFirstAsync<{value:string}>('SELECT value FROM app_state WHERE key=?',key);return r?JSON.parse(r.value) as T:null;}
export async function setSetting(key:string,value:unknown){const d=await db();await d.runAsync(`INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`,key,JSON.stringify(value));}
export async function getSetting<T>(key:string,fallback:T):Promise<T>{const d=await db();const r=await d.getFirstAsync<{value:string}>('SELECT value FROM settings WHERE key=?',key);return r?JSON.parse(r.value) as T:fallback;}

export async function addHistory(fingerprint:string,track:Track){const d=await db();await d.runAsync('INSERT INTO history(fingerprint,track_json,played_at) VALUES(?,?,?)',fingerprint,JSON.stringify(track),Date.now());await d.runAsync(`INSERT INTO track_stats(fingerprint,track_json,plays,last_played) VALUES(?,?,1,?) ON CONFLICT(fingerprint) DO UPDATE SET plays=plays+1,last_played=excluded.last_played,track_json=excluded.track_json`,fingerprint,JSON.stringify(track),Date.now());await d.runAsync(`DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY played_at DESC LIMIT 1000)`);}
export async function updateTrackOutcome(fingerprint:string,seconds:number,completed:boolean,skipped:boolean){const d=await db();await d.runAsync(`UPDATE track_stats SET total_seconds=total_seconds+?,completed=completed+?,skips=skips+? WHERE fingerprint=?`,Math.max(0,Math.floor(seconds)),completed?1:0,skipped?1:0,fingerprint);}
export async function listHistory(limit=100):Promise<Track[]>{const d=await db();const rows=await d.getAllAsync<{track_json:string}>('SELECT track_json FROM history ORDER BY played_at DESC LIMIT ?',limit);return rows.map(r=>JSON.parse(r.track_json));}
export async function toggleFavorite(fingerprint:string,track:Track):Promise<boolean>{const d=await db();const e=await d.getFirstAsync('SELECT fingerprint FROM favorites WHERE fingerprint=?',fingerprint);if(e){await d.runAsync('DELETE FROM favorites WHERE fingerprint=?',fingerprint);return false;}await d.runAsync('INSERT INTO favorites(fingerprint,track_json,created_at) VALUES(?,?,?)',fingerprint,JSON.stringify(track),Date.now());return true;}
export async function listFavorites():Promise<Track[]>{const d=await db();const rows=await d.getAllAsync<{track_json:string}>('SELECT track_json FROM favorites ORDER BY created_at DESC');return rows.map(r=>JSON.parse(r.track_json));}
export async function block(kind:'artist'|'track',value:string){const d=await db();await d.runAsync('INSERT OR IGNORE INTO blocked(kind,value,created_at) VALUES(?,?,?)',kind,value.toLowerCase().trim(),Date.now());}
export async function unblock(kind:'artist'|'track',value:string){const d=await db();await d.runAsync('DELETE FROM blocked WHERE kind=? AND value=?',kind,value.toLowerCase().trim());}
export async function isBlocked(track:Track){const d=await db();const artist=track.artist.toLowerCase().trim();const title=track.title.toLowerCase().trim();const r=await d.getFirstAsync(`SELECT 1 FROM blocked WHERE (kind='artist' AND value=?) OR (kind='track' AND value=?) LIMIT 1`,artist,title);return !!r;}
export async function rememberSearch(query:string){const d=await db();const q=query.trim();if(!q)return;await d.runAsync(`INSERT INTO search_history(query,last_used,use_count) VALUES(?,?,1) ON CONFLICT(query) DO UPDATE SET last_used=excluded.last_used,use_count=use_count+1`,q,Date.now());}
export async function recentSearches(limit=12){const d=await db();return d.getAllAsync<{query:string}>('SELECT query FROM search_history ORDER BY last_used DESC LIMIT ?',limit);}
export async function cacheGet<T>(key:string):Promise<T|null>{const d=await db();const r=await d.getFirstAsync<{payload:string;expires_at:number}>('SELECT payload,expires_at FROM search_cache WHERE cache_key=?',key);if(!r||r.expires_at<Date.now()){if(r)await d.runAsync('DELETE FROM search_cache WHERE cache_key=?',key);return null;}return JSON.parse(r.payload) as T;}
export async function cacheSet(key:string,value:unknown,ttlMs:number){const d=await db();await d.runAsync(`INSERT INTO search_cache(cache_key,payload,expires_at) VALUES(?,?,?) ON CONFLICT(cache_key) DO UPDATE SET payload=excluded.payload,expires_at=excluded.expires_at`,key,JSON.stringify(value),Date.now()+ttlMs);}
export async function topStats(limit=100){const d=await db();return d.getAllAsync<{track_json:string;plays:number;completed:number;skips:number;total_seconds:number;last_played:number}>('SELECT track_json,plays,completed,skips,total_seconds,last_played FROM track_stats ORDER BY (plays*3+completed*5-skips*4) DESC,last_played DESC LIMIT ?',limit);}
export async function createPlaylist(name:string,kind='manual',rule?:unknown){const d=await db();const id=`pl_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;const now=Date.now();await d.runAsync('INSERT INTO playlists(id,name,kind,rule_json,created_at,updated_at) VALUES(?,?,?,?,?,?)',id,name,kind,rule?JSON.stringify(rule):null,now,now);return id;}
export async function listPlaylists(){const d=await db();return d.getAllAsync<{id:string;name:string;kind:string;rule_json:string|null}>('SELECT id,name,kind,rule_json FROM playlists ORDER BY updated_at DESC');}
export async function addTrackToPlaylist(id:string,track:Track,fingerprint:string){const d=await db();const p=await d.getFirstAsync<{n:number}>('SELECT COALESCE(MAX(position),-1)+1 n FROM playlist_tracks WHERE playlist_id=?',id);await d.runAsync('INSERT OR REPLACE INTO playlist_tracks(playlist_id,fingerprint,track_json,position) VALUES(?,?,?,?)',id,fingerprint,JSON.stringify(track),p?.n??0);await d.runAsync('UPDATE playlists SET updated_at=? WHERE id=?',Date.now(),id);}
export async function playlistTracks(id:string):Promise<Track[]>{const d=await db();const rows=await d.getAllAsync<{track_json:string}>('SELECT track_json FROM playlist_tracks WHERE playlist_id=? ORDER BY position',id);return rows.map(r=>JSON.parse(r.track_json));}
export async function deletePlaylist(id:string){const d=await db();await d.runAsync('DELETE FROM playlists WHERE id=?',id);}
export async function exportDatabaseSnapshot(){return {favorites:await listFavorites(),history:await listHistory(1000),playlists:await listPlaylists(),settings:await (await db()).getAllAsync('SELECT key,value FROM settings')};}
