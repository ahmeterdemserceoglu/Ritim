import * as Network from 'expo-network';
import {loadPreferences} from '@/services/preferences';

export type Diagnostics={
 timestamp:number;
 networkType:string;
 isConnected:boolean;
 serverUrl:string;
 serverReachable:boolean;
 serverLatencyMs:number|null;
};

export async function collectDiagnostics():Promise<Diagnostics>{
 const [state,prefs]=await Promise.all([Network.getNetworkStateAsync(),loadPreferences()]);
 let serverReachable=false,serverLatencyMs:number|null=null;
 if(prefs.serverUrl){
  const start=Date.now();
  try{
   const controller=new AbortController();
   const timer=setTimeout(()=>controller.abort(),4000);
   const res=await fetch(`${prefs.serverUrl.replace(/\/$/,'')}/health`,{signal:controller.signal});
   clearTimeout(timer);
   serverReachable=res.ok;
   serverLatencyMs=Date.now()-start;
  }catch{}
 }
 return {timestamp:Date.now(),networkType:String(state.type??'UNKNOWN'),isConnected:!!state.isConnected,serverUrl:prefs.serverUrl,serverReachable,serverLatencyMs};
}
