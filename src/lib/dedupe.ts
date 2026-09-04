import type {Track} from "@/types/music";
const clean=(v="")=>v.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\([^)]*(official|audio|video|lyrics?|remaster(ed)?)[^)]*\)/gi,"").replace(/\[[^\]]*(official|audio|video|lyrics?|remaster(ed)?)[^\]]*\]/gi,"").replace(/[^a-z0-9ığüşöç\s]/gi," ").replace(/\s+/g," ").trim();
export const trackFingerprint=(t:Track)=>t.isrc?`isrc:${t.isrc.toUpperCase()}`:`${clean(t.artist)}|${clean(t.title)}`;
export const dedupeTracks=(tracks:Track[])=>{const map=new Map<string,Track>();for(const t of tracks){const k=trackFingerprint(t),c=map.get(k);if(!c)map.set(k,t);else if(!c.streamUrl&&t.streamUrl)map.set(k,t)}return [...map.values()]};
