import {Alert,Pressable,StyleSheet,Text,View} from 'react-native';
import {Image} from 'expo-image';
import {colors} from '@/theme';
import type {Track} from '@/types/music';
import {usePlayer} from '@/context/PlayerContext';
import {useLibrary} from '@/context/LibraryContext';
import {trackFingerprint} from '@/lib/dedupe';

export function TrackRow({track,queue}:{track:Track;queue?:Track[]}){
  const {playTrack}=usePlayer();
  const {favoriteKeys,toggleFavorite,download}=useLibrary();
  const playable=!!track.streamUrl;
  const favorite=favoriteKeys.has(trackFingerprint(track));

  const onDownload=async()=>{
    if(!playable)return;
    try{await download(track);Alert.alert('İndirildi',`${track.title} artık çevrimdışı oynatılabilir.`)}
    catch(e){Alert.alert('İndirme başarısız',e instanceof Error?e.message:'Dosya indirilemedi.')}
  };

  return <View style={styles.row}>
    <Pressable style={styles.main} onPress={()=>{if(playable)playTrack(track,queue)}}>
      <Image source={track.artworkUrl?{uri:track.artworkUrl}:undefined} style={styles.cover}/>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.title}>{track.title}</Text>
        <Text numberOfLines={1} style={styles.meta}>{track.artist}{track.album?` • ${track.album}`:''}</Text>
        <Text style={[styles.source,!playable&&styles.disabled]}>{playable?'▶ Oynatılabilir':'Metadata'}</Text>
      </View>
    </Pressable>
    <Pressable hitSlop={10} onPress={()=>toggleFavorite(track).catch(()=>{})} style={styles.action}>
      <Text style={[styles.heart,favorite&&styles.heartOn]}>{favorite?'♥':'♡'}</Text>
    </Pressable>
    {playable&&<Pressable hitSlop={10} onPress={onDownload} style={styles.action}><Text style={styles.download}>↓</Text></Pressable>}
  </View>
}

const styles=StyleSheet.create({
  row:{flexDirection:'row',alignItems:'center',paddingVertical:8},main:{flex:1,flexDirection:'row',alignItems:'center'},
  cover:{width:54,height:54,borderRadius:10,backgroundColor:colors.card2},body:{flex:1,paddingHorizontal:12},
  title:{color:colors.text,fontSize:15,fontWeight:'800'},meta:{color:colors.muted,marginTop:3,fontSize:12},
  source:{color:colors.green,fontSize:11,marginTop:5,fontWeight:'700'},disabled:{color:colors.muted},
  action:{width:38,height:44,alignItems:'center',justifyContent:'center'},heart:{color:colors.muted,fontSize:23},heartOn:{color:colors.green},download:{color:colors.text,fontSize:25,fontWeight:'700'}
});
