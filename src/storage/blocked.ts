import * as SQLite from 'expo-sqlite';
export type BlockedItem={kind:'artist'|'track';value:string;createdAt:number};
export async function listBlocked():Promise<BlockedItem[]>{const db=await SQLite.openDatabaseAsync('ritim.db');const rows=await db.getAllAsync<{kind:'artist'|'track';value:string;created_at:number}>('SELECT kind,value,created_at FROM blocked ORDER BY created_at DESC');return rows.map(x=>({kind:x.kind,value:x.value,createdAt:x.created_at}))}
export async function removeBlocked(kind:'artist'|'track',value:string){const db=await SQLite.openDatabaseAsync('ritim.db');await db.runAsync('DELETE FROM blocked WHERE kind=? AND value=?',kind,value)}
