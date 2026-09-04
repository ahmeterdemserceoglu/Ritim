import {Directory,File,Paths} from 'expo-file-system';
import {addTrackToPlaylist,createPlaylist,initDatabase,listFavorites,listPlaylists,playlistTracks,setSetting,toggleFavorite} from '@/storage/database';
import {trackFingerprint} from '@/lib/dedupe';
import type {Track} from '@/types/music';
import * as SQLite from 'expo-sqlite';

const backupDir=new Directory(Paths.document,'ritim-backups');
function ensureDir(){if(!backupDir.exists)backupDir.create()}
export async function createBackup(){await initDatabase();ensureDir();const playlists=await listPlaylists();const enriched=[];for(const p of playlists)enriched.push({...p,tracks:await playlistTracks(p.id)});const db=await SQLite.openDatabaseAsync('ritim.db');const settings=await db.getAllAsync<{key:string;value:string}>('SELECT key,value FROM settings');const snapshot={favorites:await listFavorites(),playlists:enriched,settings};const payload=JSON.stringify({version:2,createdAt:Date.now(),snapshot},null,2);const file=new File(backupDir,`ritim-backup-${Date.now()}.json`);file.create();file.write(payload);return file.uri;}
export async function listBackups(){ensureDir();return backupDir.list().filter((x:any)=>x instanceof File&&x.name.endsWith('.json')).map((x:any)=>({name:x.name,uri:x.uri,modified:x.modificationTime||0})).sort((a:any,b:any)=>b.modified-a.modified)}
export async function restoreBackup(uri:string){const file=new File(uri);if(!file.exists)throw new Error('Yedek dosyası bulunamadı.');const data=JSON.parse(await file.text());if(![1,2].includes(data?.version)||!data?.snapshot)throw new Error('Geçersiz Ritim yedeği.');await initDatabase();const s=data.snapshot;const existing=new Set((await listFavorites()).map(trackFingerprint));for(const t of(s.favorites??[])as Track[]){const fp=trackFingerprint(t);if(!existing.has(fp)){await toggleFavorite(fp,t);existing.add(fp)}}for(const p of s.playlists??[]){const id=await createPlaylist(p.name,p.kind,p.rule_json?JSON.parse(p.rule_json):undefined);for(const t of(p.tracks??[])as Track[])await addTrackToPlaylist(id,t,trackFingerprint(t))}for(const row of s.settings??[]){try{await setSetting(row.key,JSON.parse(row.value))}catch{}}return true;}
export async function restoreLatestBackup(){const backups=await listBackups();if(!backups.length)throw new Error('Geri yüklenecek Ritim yedeği yok.');return restoreBackup(backups[0].uri)}
