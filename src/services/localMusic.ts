import {AssetField,MediaType,Query,requestPermissionsAsync} from 'expo-media-library';
import type {Track} from '@/types/music';

export async function scanLocalMusic(limit=1000):Promise<Track[]>{
  const permission=await requestPermissionsAsync(false,['audio']);
  if(!permission.granted)throw new Error('Yerel müzikleri görmek için medya izni gerekli.');
  const assets=await new Query().limit(limit).eq(AssetField.MEDIA_TYPE,MediaType.AUDIO).exe();
  return assets.map((a:any)=>{
    const filename=String(a.filename||'Yerel parça');
    const title=filename.replace(/\.[a-z0-9]{2,5}$/i,'').replace(/[_-]+/g,' ').trim();
    return {id:`local:${a.id}`,source:'local',title,artist:'Cihazdaki Müzik',streamUrl:a.uri,duration:typeof a.duration==='number'?Math.round(a.duration):undefined} as Track;
  });
}
