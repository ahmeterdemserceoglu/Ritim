import {Directory,File,Paths} from 'expo-file-system';
import * as Network from 'expo-network';
import type {Track} from '@/types/music';
import {trackFingerprint} from '@/lib/dedupe';
import * as SQLite from 'expo-sqlite';
import {loadPreferences} from './preferences';

const downloadDir=new Directory(Paths.document,'ritim-downloads');
let queue=Promise.resolve();
async function ensureDir(){if(!downloadDir.exists)downloadDir.create();}
async function checkPolicy(){const prefs=await loadPreferences();if(!prefs.wifiOnlyDownloads)return;const n=await Network.getNetworkStateAsync();if(String(n.type).toUpperCase()!=='WIFI')throw new Error('İndirme yalnızca Wi‑Fi üzerinde açık.');}

export async function downloadTrack(track:Track){
 const task=async()=>{if(!track.streamUrl)throw new Error('Bu parça indirilemiyor.');await checkPolicy();await ensureDir();const fingerprint=trackFingerprint(track);const safe=fingerprint.replace(/[^a-z0-9_-]/gi,'_').slice(0,100);const target=new File(downloadDir,`${safe}.audio`);if(target.exists)target.delete();const downloaded=await File.downloadFileAsync(track.streamUrl,target,{idempotent:true});const db=await SQLite.openDatabaseAsync('ritim.db');await db.runAsync(`INSERT INTO downloads(fingerprint,track_json,local_uri,bytes,created_at) VALUES(?,?,?,?,?) ON CONFLICT(fingerprint) DO UPDATE SET track_json=excluded.track_json,local_uri=excluded.local_uri,bytes=excluded.bytes,created_at=excluded.created_at`,fingerprint,JSON.stringify(track),downloaded.uri,downloaded.size??0,Date.now());return downloaded.uri;};
 let resolveValue:(v:string)=>void=()=>{},rejectValue:(e:unknown)=>void=()=>{};const result=new Promise<string>((res,rej)=>{resolveValue=res;rejectValue=rej});queue=queue.then(()=>task().then(resolveValue).catch(rejectValue));return result;
}
export async function removeDownload(track:Track){const fingerprint=trackFingerprint(track);const db=await SQLite.openDatabaseAsync('ritim.db');const row=await db.getFirstAsync<{local_uri:string}>('SELECT local_uri FROM downloads WHERE fingerprint=?',fingerprint);if(row?.local_uri){try{const f=new File(row.local_uri);if(f.exists)f.delete()}catch{}}await db.runAsync('DELETE FROM downloads WHERE fingerprint=?',fingerprint);}
export async function resolvePlayableUri(track:Track):Promise<string|undefined>{const fingerprint=trackFingerprint(track);const db=await SQLite.openDatabaseAsync('ritim.db');const row=await db.getFirstAsync<{local_uri:string}>('SELECT local_uri FROM downloads WHERE fingerprint=?',fingerprint);if(row?.local_uri){try{if(new File(row.local_uri).exists)return row.local_uri}catch{}}return track.streamUrl;}
export async function listDownloads(){const db=await SQLite.openDatabaseAsync('ritim.db');const rows=await db.getAllAsync<{track_json:string;local_uri:string;bytes:number;created_at:number}>('SELECT track_json,local_uri,bytes,created_at FROM downloads ORDER BY created_at DESC');return rows.map(r=>({track:JSON.parse(r.track_json) as Track,localUri:r.local_uri,bytes:r.bytes,createdAt:r.created_at}));}
export async function totalDownloadedBytes(){return (await listDownloads()).reduce((a,b)=>a+(b.bytes||0),0);}
