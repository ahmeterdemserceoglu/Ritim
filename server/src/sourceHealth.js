const hosts=new Map();
const hostOf=url=>{try{return new URL(url).host}catch{return'unknown'}};
function entry(host){const x=hosts.get(host)||{ok:0,fail:0,lastLatency:null,lastCheck:0};hosts.set(host,x);return x}
export function healthScore(url){const x=hosts.get(hostOf(url));if(!x)return 0;const total=x.ok+x.fail;if(!total)return 0;return Math.round((x.ok/total)*20)-Math.min(20,x.fail*2)}
export async function probe(url,timeoutMs=4500){const host=hostOf(url),x=entry(host),start=Date.now(),c=new AbortController(),timer=setTimeout(()=>c.abort(),timeoutMs);try{const r=await fetch(url,{method:'GET',headers:{Range:'bytes=0-1023'},signal:c.signal});x.lastLatency=Date.now()-start;x.lastCheck=Date.now();if(r.ok||r.status===206){x.ok++;return true}x.fail++;return false}catch{x.fail++;x.lastCheck=Date.now();return false}finally{clearTimeout(timer)}}
export async function checkCandidates(tracks,limit=10){for(const t of tracks.filter(x=>x.streamUrl).slice(0,limit))await probe(t.streamUrl).catch(()=>false)}
export function healthSnapshot(){return[...hosts.entries()].map(([host,x])=>({host,...x,score:healthScore(`https://${host}/`)})).sort((a,b)=>b.score-a.score)}
