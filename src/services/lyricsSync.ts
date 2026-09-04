export type LyricLine={time:number;text:string};

export function parseSyncedLyrics(input?:string|null):LyricLine[]{
 if(!input)return[];
 const lines:LyricLine[]=[];
 for(const raw of input.split(/\r?\n/)){
  const m=raw.match(/^\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\]\s*(.*)$/);
  if(!m)continue;
  const time=Number(m[1])*60+Number(m[2]);
  lines.push({time,text:m[3].trim()});
 }
 return lines.sort((a,b)=>a.time-b.time);
}

export function activeLyricIndex(lines:LyricLine[],position:number){
 let lo=0,hi=lines.length-1,best=-1;
 while(lo<=hi){const mid=(lo+hi)>>1;if(lines[mid].time<=position){best=mid;lo=mid+1}else hi=mid-1;}
 return best;
}
