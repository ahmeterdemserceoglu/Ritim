import {Pressable,StyleSheet,Text,View} from 'react-native';
import {useRouter} from 'expo-router';
import {Image} from 'expo-image';
import {colors} from '@/theme';
import {usePlayer} from '@/context/PlayerContext';

export function MiniPlayer(){
  const router=useRouter();
  const {currentTrack,isPlaying,toggle,next}=usePlayer();
  if(!currentTrack)return null;
  return <View style={styles.wrap}>
    <Pressable style={styles.info} onPress={()=>router.push('/player')}>
      <Image source={currentTrack.artworkUrl?{uri:currentTrack.artworkUrl}:undefined} style={styles.cover}/>
      <View style={styles.texts}>
        <Text numberOfLines={1} style={styles.title}>{currentTrack.title}</Text>
        <Text numberOfLines={1} style={styles.artist}>{currentTrack.artist}</Text>
      </View>
    </Pressable>
    <Pressable onPress={toggle} style={styles.control}><Text style={styles.controlText}>{isPlaying?'Ⅱ':'▶'}</Text></Pressable>
    <Pressable onPress={()=>next()} style={styles.control}><Text style={styles.next}>▶|</Text></Pressable>
  </View>
}

const styles=StyleSheet.create({
  wrap:{position:'absolute',left:10,right:10,bottom:74,height:64,borderRadius:18,backgroundColor:'#202820',borderWidth:1,borderColor:colors.line,flexDirection:'row',alignItems:'center',padding:7,zIndex:20},
  info:{flex:1,flexDirection:'row',alignItems:'center'},cover:{width:48,height:48,borderRadius:10,backgroundColor:colors.card2},texts:{flex:1,marginLeft:10},
  title:{color:colors.text,fontWeight:'800',fontSize:14},artist:{color:colors.muted,marginTop:2,fontSize:12},control:{width:46,height:48,alignItems:'center',justifyContent:'center'},controlText:{color:colors.green,fontSize:22,fontWeight:'900'},next:{color:colors.text,fontSize:16,fontWeight:'800'}
});
