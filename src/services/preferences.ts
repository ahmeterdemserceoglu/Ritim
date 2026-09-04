import {getSetting,setSetting} from '@/storage/database';

export type AudioPreferences={
 playbackRate:number;
 crossfadeSeconds:number;
 normalizeVolume:boolean;
 wifiOnlyDownloads:boolean;
 cacheLimitMb:number;
 preferredQuality:'auto'|'high'|'data-saver';
 autoCache:boolean;
 haptics:boolean;
 serverUrl:string;
};

export const DEFAULT_PREFS:AudioPreferences={
 playbackRate:1,
 crossfadeSeconds:0,
 normalizeVolume:true,
 wifiOnlyDownloads:false,
 cacheLimitMb:2048,
 preferredQuality:'auto',
 autoCache:true,
 haptics:true,
 serverUrl:''
};

export async function loadPreferences():Promise<AudioPreferences>{
 const saved=await getSetting<Partial<AudioPreferences>>('audioPreferences',{});
 return {...DEFAULT_PREFS,...saved};
}
export async function savePreferences(value:AudioPreferences){await setSetting('audioPreferences',value);}
