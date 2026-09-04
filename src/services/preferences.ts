import {getSetting,setSetting} from '@/storage/database';
import type {TrackSource} from '@/types/music';
export type AudioPreferences={playbackRate:number;crossfadeSeconds:number;normalizeVolume:boolean;wifiOnlyDownloads:boolean;cacheLimitMb:number;preferredQuality:'auto'|'high'|'data-saver';autoCache:boolean;haptics:boolean;serverUrl:string;developerMode:boolean;debugLogging:boolean;sourcePriority:TrackSource[]};
export const DEFAULT_PREFS:AudioPreferences={playbackRate:1,crossfadeSeconds:0,normalizeVolume:true,wifiOnlyDownloads:false,cacheLimitMb:2048,preferredQuality:'auto',autoCache:true,haptics:true,serverUrl:'https://ritim-tau.vercel.app',developerMode:false,debugLogging:false,sourcePriority:['local','internetarchive','openverse','musicbrainz','radio']};
export async function loadPreferences():Promise<AudioPreferences>{const saved=await getSetting<Partial<AudioPreferences>>('audioPreferences',{});return{...DEFAULT_PREFS,...saved,sourcePriority:saved.sourcePriority?.length?saved.sourcePriority:DEFAULT_PREFS.sourcePriority}}
export async function savePreferences(value:AudioPreferences){await setSetting('audioPreferences',value)}
