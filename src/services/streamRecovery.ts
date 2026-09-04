import type {Track} from '@/types/music';
import {RITIM_SERVER_URL,SERVER_ENABLED} from '@/config/runtime';
import {searchAllMusic} from '@/services/search';
import {trackFingerprint} from '@/lib/dedupe';

export async function recoveryCandidates(track:Track):Promise<string[]>{
 const urls=new Set<string>();
 if(track.streamUrl)urls.add(track.streamUrl);
 for(const a of track.alternatives??[])if(a.streamUrl)urls.add(a.streamUrl);
 const q=`${track.artist} ${track.title}`;
 if(SERVER_ENABLED){
  try{const c=new AbortController();const timer=setTimeout(()=>c.abort(),6000);const r=await fetch(`${RITIM_SERVER_URL}/v1/resolve?q=${encodeURIComponent(q)}`,{signal:c.signal});clearTimeout(timer);if(r.ok){const j=await r.json();for(const x of j.candidates??[])if(x.streamUrl)urls.add(x.streamUrl)}}catch{}
 }
 try{const fp=trackFingerprint(track);for(const x of await searchAllMusic(q))if(trackFingerprint(x)===fp&&x.streamUrl)urls.add(x.streamUrl)}catch{}
 return [...urls];
}
