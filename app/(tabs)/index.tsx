import{useEffect,useState}from'react';
import{Pressable,ScrollView,StyleSheet,Text,View}from'react-native';
import{useRouter}from'expo-router';
import{useSafeAreaInsets}from'react-native-safe-area-context';
import{colors}from'@/theme';
import{buildSmartMixes}from'@/services/recommendations';
import{TrackRow}from'@/components/TrackRow';
import{useRitimLayout}from'@/ui/layout';

export default function Home(){
 const r=useRouter();const insets=useSafeAreaInsets();const l=useRitimLayout();
 const[mixes,setMixes]=useState<any>({recent:[],mostPlayed:[],rediscover:[],artistMix:[]});
 useEffect(()=>{buildSmartMixes().then(setMixes)},[]);
 const shortcuts=[['✦','Sana Özel','/mixes'],['◉','Canlı Radyo','/(tabs)/radio'],['↓','İndirilenler','/downloads'],['♫','Cihazdaki Müzik','/local'],['⌁','Keşfet','/discovery'],['▦','Çalma Listeleri','/playlists']];
 return <ScrollView style={s.c} contentContainerStyle={{paddingTop:Math.max(insets.top+20,54),paddingBottom:170}}>
   <View style={[s.shell,{maxWidth:l.maxContentWidth,paddingHorizontal:l.horizontalPadding}]}>
     <Text style={s.logo}>RİTİM</Text>
     <Text style={[s.h,l.compact&&{fontSize:30}]}>Bugün ne dinlemek istersin?</Text>
     <Text style={s.sub}>Sevdiğin şarkılar, radyolar, listeler ve keşifler tek yerde.</Text>

     <View style={[s.grid,{gap:l.gap}]}> 
       {shortcuts.map(([icon,title,path])=><Pressable key={title} onPress={()=>r.push(path as any)} style={[s.short,{width:l.gridCardWidth,minHeight:l.tablet?112:92}]}>
         <Text style={[s.si,l.tablet&&{fontSize:24}]}>{icon}</Text><Text style={[s.st,l.tablet&&{fontSize:14}]}>{title}</Text>
       </Pressable>)}
     </View>

     <View style={[s.hero,l.tablet&&{padding:28}]}>
       <Text style={s.badge}>SANA ÖZEL</Text><Text style={[s.hh,l.tablet&&{fontSize:28}]}>Dinledikçe daha iyi öneriler</Text>
       <Text style={s.p}>Son dinlediklerin ve favorilerin üzerinden sana özel karışımlar hazırlanır.</Text>
       <Pressable onPress={()=>r.push('/mixes')} style={s.heroBtn}><Text style={s.hbt}>Karışımları aç</Text></Pressable>
     </View>

     {mixes.recent?.length>0&&<Section title="Kaldığın yerden devam et" tracks={mixes.recent.slice(0,8)}/>} 
     {mixes.mostPlayed?.length>0&&<Section title="En çok dinlediklerin" tracks={mixes.mostPlayed.slice(0,8)}/>} 
     {mixes.rediscover?.length>0&&<Section title="Tekrar keşfet" tracks={mixes.rediscover.slice(0,8)}/>} 
     <Pressable onPress={()=>r.push('/settings')} style={s.settings}><Text style={s.settingsText}>⚙ Ayarlar</Text><Text style={s.arrow}>›</Text></Pressable>
   </View>
 </ScrollView>
}
function Section({title,tracks}:{title:string;tracks:any[]}){return <View style={{marginTop:28}}><Text style={s.sec}>{title}</Text>{tracks.map((t,i)=><TrackRow key={`${t.id}-${i}`} track={t} queue={tracks}/>)}</View>}
const s=StyleSheet.create({
 c:{flex:1,backgroundColor:colors.bg},shell:{width:'100%',alignSelf:'center'},logo:{color:colors.green,fontWeight:'900',letterSpacing:3,fontSize:12},
 h:{color:colors.text,fontSize:36,fontWeight:'900',marginTop:8},sub:{color:colors.muted,fontSize:15,lineHeight:22,marginTop:6,maxWidth:620},
 grid:{flexDirection:'row',flexWrap:'wrap',marginTop:22},short:{borderRadius:20,backgroundColor:colors.card,borderWidth:1,borderColor:colors.line,padding:14,justifyContent:'space-between'},
 si:{color:colors.green,fontSize:20,fontWeight:'900'},st:{color:colors.text,fontWeight:'800',fontSize:12,lineHeight:17},hero:{marginTop:20,padding:22,borderRadius:26,backgroundColor:'#1E2A18',borderWidth:1,borderColor:'#31432A'},
 badge:{alignSelf:'flex-start',backgroundColor:colors.green,color:colors.bg,fontWeight:'900',paddingHorizontal:9,paddingVertical:4,borderRadius:99,fontSize:10},hh:{color:colors.text,fontSize:22,fontWeight:'900',marginTop:14},p:{color:'#BBC5BD',lineHeight:20,marginTop:8,maxWidth:680},heroBtn:{alignSelf:'flex-start',marginTop:15,backgroundColor:colors.green,paddingHorizontal:14,paddingVertical:10,borderRadius:12},hbt:{color:colors.bg,fontWeight:'900'},sec:{color:colors.text,fontSize:20,fontWeight:'900',marginBottom:8},settings:{height:62,marginTop:26,borderTopWidth:1,borderBottomWidth:1,borderColor:colors.line,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},settingsText:{color:colors.text,fontWeight:'800'},arrow:{color:colors.green,fontSize:28}
});
