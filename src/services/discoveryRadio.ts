import type {Track} from '@/types/music';
import {tasteProfile,rankCandidates} from './recommendations';
import {searchAllMusic} from './search';
import {trackFingerprint} from '@/lib/dedupe';
import {listHistory} from '@/storage/database';

export async function buildDiscoveryRadio(limit=50):Promise<Track[]>{
 const taste=await tasteProfile();
 const seeds=[...new Set(taste.slice(0,12).flatMap(t=>[t.artist,t.album].filter(Boolean) as string[]))].slice(0,8);
 if(!seeds.length)seeds.push('creative commons music','independent music');
 const settled=await Promise.allSettled(seeds.map(s=>searchAllMusic(s)));
 const candidates=settled.flatMap(x=>x.status==='fulfilled'?x.value:[]).filter(x=>!!x.streamUrl);
 const seen=new Set((await listHistory(1000)).map(trackFingerprint));
 const unique=new Map<string,Track>();
 for(const t of candidates){const fp=trackFingerprint(t);if(!unique.has(fp)&&!seen.has(fp))unique.set(fp,t)}
 return rankCandidates([...unique.values()],limit);
}
