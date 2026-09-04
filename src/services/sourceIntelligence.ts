import type {Track} from '@/types/music';
import {trackFingerprint} from '@/lib/dedupe';

export type Candidate={track:Track;score:number;reasons:string[]};

const licenseScore=(license?:string)=>{
 if(!license)return 0;
 const l=license.toLowerCase();
 if(l.includes('public domain')||l.includes('cc0'))return 30;
 if(l.includes('by'))return 20;
 return 5;
};

export function scoreTrack(track:Track):Candidate{
 let score=0;const reasons:string[]=[];
 if(track.streamUrl){score+=50;reasons.push('oynatılabilir');}
 if(track.artworkUrl){score+=8;reasons.push('kapak');}
 if(track.duration){score+=5;reasons.push('süre');}
 if(track.isrc){score+=18;reasons.push('ISRC');}
 const ls=licenseScore(track.license);if(ls){score+=ls;reasons.push('lisans');}
 if(track.source==='internetarchive'){score+=6;reasons.push('archive');}
 if(track.source==='openverse'){score+=8;reasons.push('openverse');}
 return {track,score,reasons};
}

export function groupAlternatives(tracks:Track[]){
 const map=new Map<string,Candidate[]>();
 for(const track of tracks){const k=trackFingerprint(track);const list=map.get(k)??[];list.push(scoreTrack(track));map.set(k,list);}
 for(const [k,list] of map)map.set(k,list.sort((a,b)=>b.score-a.score));
 return map;
}

export function bestSources(tracks:Track[]):Track[]{
 return [...groupAlternatives(tracks).values()].map(x=>x[0].track);
}

export function fallbackList(target:Track,all:Track[]){
 const fp=trackFingerprint(target);
 return (groupAlternatives(all).get(fp)??[]).map(x=>x.track).filter(x=>x.streamUrl);
}
