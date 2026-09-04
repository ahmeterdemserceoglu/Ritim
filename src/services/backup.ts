import * as FileSystem from 'expo-file-system';
import {exportDatabaseSnapshot,initDatabase,toggleFavorite,createPlaylist,addTrackToPlaylist,setSetting} from '@/storage/database';
import {trackFingerprint} from '@/lib/dedupe';
import type {Track} from '@/types/music';

export async function createBackup(){
 await initDatabase();
 const snapshot=await exportDatabaseSnapshot();
 const payload=JSON.stringify({version:1,createdAt:Date.now(),snapshot},null,2);
 const uri=`${FileSystem.documentDirectory}ritim-backup-${Date.now()}.json`;
 await FileSystem.writeAsStringAsync(uri,payload);
 return uri;
}

export async function restoreBackup(uri:string){
 const raw=await FileSystem.readAsStringAsync(uri);
 const data=JSON.parse(raw);
 if(data?.version!==1||!data?.snapshot)throw new Error('Geçersiz Ritim yedeği.');
 const s=data.snapshot;
 for(const t of (s.favorites??[]) as Track[])await toggleFavorite(trackFingerprint(t),t);
 for(const p of s.playlists??[]){
   const id=await createPlaylist(p.name,p.kind,p.rule_json?JSON.parse(p.rule_json):undefined);
   for(const t of (p.tracks??[]) as Track[])await addTrackToPlaylist(id,t,trackFingerprint(t));
 }
 for(const row of s.settings??[]){try{await setSetting(row.key,JSON.parse(row.value));}catch{}}
 return true;
}
