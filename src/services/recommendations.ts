import type {Track} from '@/types/music';
import {topStats,listFavorites,listHistory,isBlocked} from '@/storage/database';
import {trackFingerprint} from '@/lib/dedupe';

const words=(s:string)=>new Set(s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>2));
const similarity=(a:Track,b:Track)=>{
 let score=0;
 if(a.artist.toLowerCase()===b.artist.toLowerCase())score+=8;
 if(a.album&&b.album&&a.album.toLowerCase()===b.album.toLowerCase())score+=4;
 const A=words(`${a.title} ${a.artist} ${a.album??''}`),B=words(`${b.title} ${b.artist} ${b.album??''}`);
 for(const w of A)if(B.has(w))score+=1;
 return score;
};

export async function tasteProfile(){
 const stats=await topStats(120);const favorites=await listFavorites();
 const tracks=[...favorites,...stats.map(r=>JSON.parse(r.track_json) as Track)];
 const unique=new Map(tracks.map(t=>[trackFingerprint(t),t]));
 return [...unique.values()];
}

export async function rankCandidates(candidates:Track[],limit=40){
 const taste=await tasteProfile();const seen=new Set((await listHistory(500)).map(trackFingerprint));
 const rows: {track:Track;score:number}[]=[];
 for(const c of candidates){if(await isBlocked(c))continue;let score=0;for(const t of taste.slice(0,40))score=Math.max(score,similarity(c,t));if(!seen.has(trackFingerprint(c)))score+=3;if(c.streamUrl)score+=4;rows.push({track:c,score});}
 return rows.sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.track);
}

export async function buildSmartMixes(){
 const stats=await topStats(200);const tracks=stats.map(r=>JSON.parse(r.track_json) as Track);
 const mostPlayed=tracks.slice(0,30);
 const recent=await listHistory(50);
 const rediscover=tracks.filter((_,i)=>i>20).slice(0,30);
 const artists=new Map<string,Track[]>();for(const t of tracks){const k=t.artist.toLowerCase();artists.set(k,[...(artists.get(k)??[]),t]);}
 const artistMix=[...artists.values()].sort((a,b)=>b.length-a.length).slice(0,5).flatMap(x=>x.slice(0,5));
 return {mostPlayed,recent,rediscover,artistMix};
}
