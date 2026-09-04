import {RITIM_SERVER_URL} from '@/config/runtime';
import {loadPreferences} from '@/services/preferences';

export async function getServerUrl(){
  try{const prefs=await loadPreferences();const value=(prefs.serverUrl||RITIM_SERVER_URL||'').trim().replace(/\/$/,'');return value}catch{return RITIM_SERVER_URL}
}
export async function serverEnabled(){return !!(await getServerUrl())}
export async function serverFetch(path:string,init?:RequestInit,timeoutMs=9000){
  const base=await getServerUrl();if(!base)throw new Error('Ritim Server kapalı.');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetch(`${base}${path.startsWith('/')?path:`/${path}`}`,{...init,signal:controller.signal})}finally{clearTimeout(timer)}
}
