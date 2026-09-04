import {searchInternetArchive} from './internetArchive';
import {searchMusicBrainz} from './musicbrainz';
import {searchOpenverse} from './openverse';
import {bestSources} from './sourceIntelligence';
import {cacheGet,cacheSet,isBlocked,rememberSearch} from '@/storage/database';
import {serverFetch,serverEnabled} from './serverConfig';
import type {Track} from '@/types/music';

const normalize=(s:string)=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9ığüşöç\s]/gi,' ').replace(/\s+/g,' ').trim();
async function searchViaServer(query:string):Promise<Track[]>{const response=await serverFetch(`/v1/search?q=${encodeURIComponent(query)}`);if(!response.ok)throw new Error(`Ritim server ${response.status}`);const json=await response.json();return Array.isArray(json.tracks)?json.tracks:[];}
async function searchDirect(query:string):Promise<Track[]>{const tasks=await Promise.allSettled([searchOpenverse(query),searchInternetArchive(query),searchMusicBrainz(query)]);return tasks.flatMap(x=>x.status==='fulfilled'?x.value:[]);}
export async function searchAllMusic(query:string):Promise<Track[]>{const q=query.trim();if(q.length<2)return[];await rememberSearch(q).catch(()=>{});const key=`search:${normalize(q)}`;const cached=await cacheGet<Track[]>(key);if(cached?.length)return cached;let raw:Track[]=[];if(await serverEnabled()){try{raw=await searchViaServer(q)}catch{}}if(!raw.length)raw=await searchDirect(q);const ranked=bestSources(raw);const filtered:Track[]=[];for(const t of ranked)if(!(await isBlocked(t)))filtered.push(t);await cacheSet(key,filtered,15*60*1000).catch(()=>{});return filtered;}
