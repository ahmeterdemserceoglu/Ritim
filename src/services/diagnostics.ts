import * as Network from 'expo-network';
import {getServerUrl,serverFetch} from './serverConfig';
export type Diagnostics={timestamp:number;networkType:string;isConnected:boolean;serverUrl:string;serverReachable:boolean;serverLatencyMs:number|null};
export async function collectDiagnostics():Promise<Diagnostics>{const state=await Network.getNetworkStateAsync();const serverUrl=await getServerUrl();let serverReachable=false,serverLatencyMs:number|null=null;if(serverUrl){const start=Date.now();try{const res=await serverFetch('/health',undefined,4000);serverReachable=res.ok;serverLatencyMs=Date.now()-start}catch{}}return{timestamp:Date.now(),networkType:String(state.type??'UNKNOWN'),isConnected:!!state.isConnected,serverUrl,serverReachable,serverLatencyMs};}
