import type {Track} from '@/types/music';
import {searchAllMusic} from '@/services/search';
import {trackFingerprint} from '@/lib/dedupe';
import {serverFetch,serverEnabled} from './serverConfig';
export async function recoveryCandidates(track:Track):Promise<string[]>{const urls=new Set<string>();if(track.streamUrl)urls.add(track.streamUrl);for(const a of track.alternatives??[])if(a.streamUrl)urls.add(a.streamUrl);const q=`${track.artist} ${track.title}`;if(await serverEnabled()){try{const r=await serverFetch(`/v1/resolve?q=${encodeURIComponent(q)}`,undefined,6000);if(r.ok){const j=await r.json();for(const x of j.candidates??[])if(x.streamUrl)urls.add(x.streamUrl)}}catch{}}try{const fp=trackFingerprint(track);for(const x of await searchAllMusic(q))if(trackFingerprint(x)===fp&&x.streamUrl)urls.add(x.streamUrl)}catch{}return[...urls];}
