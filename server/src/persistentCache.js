import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const dir=path.resolve(process.cwd(),'.ritim-cache');const file=path.join(dir,'cache.json');let data=new Map();let loaded=false;let timer=null;
async function load(){if(loaded)return;loaded=true;try{await mkdir(dir,{recursive:true});const raw=JSON.parse(await readFile(file,'utf8'));data=new Map(Object.entries(raw||{}))}catch{data=new Map()}}
function schedule(){if(timer)return;timer=setTimeout(async()=>{timer=null;try{await mkdir(dir,{recursive:true});await writeFile(file,JSON.stringify(Object.fromEntries(data)),'utf8')}catch{}},400)}
export async function cacheGet(key,ttl){await load();const hit=data.get(key);if(!hit)return null;if(Date.now()-hit.at>ttl){data.delete(key);schedule();return null}return hit.value}
export async function cacheSet(key,value){await load();data.set(key,{at:Date.now(),value});schedule()}
export async function cacheStats(){await load();return{entries:data.size,file}}
export async function cacheClear(){await load();data.clear();schedule()}
