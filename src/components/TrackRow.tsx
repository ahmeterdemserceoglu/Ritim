import {Alert,Pressable,StyleSheet,Text,View} from 'react-native';
import {Image} from 'expo-image';
import {useRouter} from 'expo-router';
import * as Haptics from 'expo-haptics';
import {colors} from '@/theme';
import type {Track} from '@/types/music';
import {usePlayer} from '@/context/PlayerContext';
import {useLibrary} from '@/context/LibraryContext';
import {trackFingerprint} from '@/lib/dedupe';
import {block} from '@/storage/database';

export function TrackRow({track,queue}:{track:Track;queue?:Track[]}){
 const router=useRouter();const{playTrack,enqueue,playNext}=usePlayer();const{favoriteKeys,toggleFavorite,download}=useLibrary();const playable=!!track.streamUrl;const favorite=favoriteKeys.has(trackFingerprint(track));
 const onDownload=async()=>{if(!playable)return;try{await download(track);Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);Alert.alert('İndirildi',`${track.title} artık çevrimdışı oynatılabilir.`)}catch(e){Alert.alert('İndirme başarısız',e instanceof Error?e.message:'Dosya indirilemedi.')}};
 const menu=()=>{Haptics.selectionAsync();Alert.alert(track.title,track.artist,[
  ...(playable?[{text:'Sonraki çal',onPress:()=>playNext(track)},{text:'Sıraya ekle',onPress:()=>enqueue(track)},{text:'İndir',onPress:onDownload}]:[]),
  {text:'Sanatçıya git',onPress:()=>router.push({pathname:'/artist/[name]',params:{name:track.artist}})},
  {text:'Bu parçayı önerme',style:'destructive' as const,onPress:()=>block('track',track.title)},
  {text:'Bu sanatçıyı önerme',style:'destructive' as const,onPress:()=>block('artist',track.artist)},
  {text:'Vazgeç',style:'cancel' as const}
 ])};
 return <View style={styles.row}><Pressable style={styles.main} onPress={()=>{if(playable){Haptics.selectionAsync();playTrack(track,queue)}}} onLongPress={menu}><Image source={track.artworkUrl?{uri:track.artworkUrl}:undefined} style={styles.cover}/><View style={styles.body}><Text numberOfLines={1} style={styles.title}>{track.title}</Text><Text numberOfLines={1} style={styles.meta}>{track.artist}{track.album?` • ${track.album}`:''}</Text><Text style={[styles.source,!playable&&styles.disabled]}>{playable?'▶ Oynatılabilir':'Metadata'}{track.bitrate?` • ${track.bitrate} kbps`:''}</Text></View></Pressable><Pressable hitSlop={10} onPress={()=>{Haptics.selectionAsync();toggleFavorite(track).catch(()=>{})}} style={styles.action}><Text style={[styles.heart,favorite&&styles.heartOn]}>{favorite?'♥':'♡'}</Text></Pressable><Pressable hitSlop={10} onPress={menu} style={styles.action}><Text style={styles.more}>⋮</Text></Pressable></View>
}
const styles=StyleSheet.create({row:{flexDirection:'row',alignItems:'center',paddingVertical:8},main:{flex:1,flexDirection:'row',alignItems:'center'},cover:{width:54,height:54,borderRadius:10,backgroundColor:colors.card2},body:{flex:1,paddingHorizontal:12},title:{color:colors.text,fontSize:15,fontWeight:'800'},meta:{color:colors.muted,marginTop:3,fontSize:12},source:{color:colors.green,fontSize:11,marginTop:5,fontWeight:'700'},disabled:{color:colors.muted},action:{width:38,height:44,alignItems:'center',justifyContent:'center'},heart:{color:colors.muted,fontSize:23},heartOn:{color:colors.green},more:{color:colors.text,fontSize:25,fontWeight:'700'}});
