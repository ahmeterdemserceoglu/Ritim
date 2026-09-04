import {dedupeTracks} from "@/lib/dedupe";
import {RITIM_SERVER_URL,SERVER_ENABLED} from "@/config/runtime";
import {searchInternetArchive} from "./internetArchive";
import {searchMusicBrainz} from "./musicbrainz";
import {searchOpenverse} from "./openverse";
import type {Track} from "@/types/music";

async function searchViaServer(query:string):Promise<Track[]>{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),10000);
  try{
    const response=await fetch(`${RITIM_SERVER_URL}/v1/search?q=${encodeURIComponent(query)}`,{signal:controller.signal});
    if(!response.ok)throw new Error(`Ritim server ${response.status}`);
    const json=await response.json();
    return Array.isArray(json.tracks)?json.tracks:[];
  }finally{clearTimeout(timer)}
}

async function searchDirect(query:string):Promise<Track[]>{
  const tasks=await Promise.allSettled([
    searchOpenverse(query),
    searchInternetArchive(query),
    searchMusicBrainz(query)
  ]);
  return dedupeTracks(tasks.flatMap(x=>x.status==="fulfilled"?x.value:[]))
    .sort((a,b)=>Number(!!b.streamUrl)-Number(!!a.streamUrl));
}

export async function searchAllMusic(query:string):Promise<Track[]>{
  const q=query.trim();
  if(q.length<2)return[];
  if(SERVER_ENABLED){
    try{return dedupeTracks(await searchViaServer(q));}catch{}
  }
  return searchDirect(q);
}
