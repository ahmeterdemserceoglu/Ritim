import {Pressable,StyleSheet,Text,View} from 'react-native';
import {Image} from 'expo-image';
import {colors} from '@/theme';
import type {Track} from '@/types/music';
import {usePlayer} from '@/context/PlayerContext';

export function TrackRow({track,queue}:{track:Track;queue?:Track[]}){
  const {playTrack}=usePlayer();
  const playable=!!track.streamUrl;
  return <Pressable onPress={()=>{if(playable)playTrack(track,queue)}} style={({pressed})=>[styles.row,pressed&&playable&&{opacity:.72}]}>
    <Image source={track.artworkUrl?{uri:track.artworkUrl}:undefined} style={styles.cover}/>
    <View style={styles.body}>
      <Text numberOfLines={1} style={styles.title}>{track.title}</Text>
      <Text numberOfLines={1} style={styles.meta}>{track.artist}{track.album?` • ${track.album}`:''}</Text>
      <Text style={[styles.source,!playable&&styles.disabled]}>{playable?'▶ Oynatılabilir':'Metadata'}</Text>
    </View>
    <Text style={styles.more}>⋮</Text>
  </Pressable>
}

const styles=StyleSheet.create({
  row:{flexDirection:'row',alignItems:'center',paddingVertical:8},
  cover:{width:54,height:54,borderRadius:10,backgroundColor:colors.card2},
  body:{flex:1,paddingHorizontal:12},
  title:{color:colors.text,fontSize:15,fontWeight:'800'},
  meta:{color:colors.muted,marginTop:3,fontSize:12},
  source:{color:colors.green,fontSize:11,marginTop:5,fontWeight:'700'},
  disabled:{color:colors.muted},more:{color:colors.muted,fontSize:24,paddingHorizontal:8}
});
