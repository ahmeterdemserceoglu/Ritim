import type {RadioStation} from '@/types/music';
const HOSTS=['https://de1.api.radio-browser.info/json','https://fi1.api.radio-browser.info/json','https://nl1.api.radio-browser.info/json'];
export type RadioFilters={query?:string;country?:string;language?:string;tag?:string;minBitrate?:number;codec?:string;limit?:number};
export async function searchStations(input:string|RadioFilters='Turkey'):Promise<RadioStation[]>{
 const f:RadioFilters=typeof input==='string'?{query:input}:input;const p=new URLSearchParams({hidebroken:'true',limit:String(f.limit??60),order:'clickcount',reverse:'true'});
 if(f.query)p.set('name',f.query);if(f.country)p.set('country',f.country);if(f.language)p.set('language',f.language);if(f.tag)p.set('tag',f.tag);if(f.codec)p.set('codec',f.codec);
 let last:unknown;
 for(const base of HOSTS){try{const r=await fetch(`${base}/stations/search?${p}`,{headers:{'User-Agent':'Ritim/0.4'}});if(!r.ok)throw new Error(`Radio Browser ${r.status}`);const j=await r.json();return(j??[]).filter((s:any)=>(s.url_resolved||s.url)&&Number(s.bitrate||0)>=(f.minBitrate??0)).map((s:any)=>({id:s.stationuuid,name:s.name||'İsimsiz radyo',streamUrl:s.url_resolved||s.url,favicon:s.favicon||undefined,country:s.country||undefined,codec:s.codec||undefined,bitrate:Number(s.bitrate||0)||undefined,tags:typeof s.tags==='string'?s.tags.split(',').filter(Boolean):[]})).sort((a:any,b:any)=>(b.bitrate||0)-(a.bitrate||0));}catch(e){last=e}}
 throw last instanceof Error?last:new Error('Radyo istasyonları alınamadı.');
}
