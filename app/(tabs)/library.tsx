import{useState}from"react";
import{FlatList,Pressable,StyleSheet,Text,View}from"react-native";
import{colors}from"@/theme";
import{TrackRow}from"@/components/TrackRow";
import{useLibrary}from"@/context/LibraryContext";

type Tab="favorites"|"history";

export default function Library(){
  const[tab,setTab]=useState<Tab>("favorites");
  const{favorites,history,refresh}=useLibrary();
  const data=tab==="favorites"?favorites:history;
  return <View style={s.c}>
    <View style={s.header}>
      <Text style={s.h}>Kitaplık</Text>
      <Text style={s.sub}>Giriş yok. Her şey bu cihazda.</Text>
      <View style={s.tabs}>
        <Pressable onPress={()=>setTab("favorites")} style={[s.tab,tab==="favorites"&&s.active]}><Text style={[s.tabText,tab==="favorites"&&s.activeText]}>Beğenilenler</Text></Pressable>
        <Pressable onPress={()=>{setTab("history");refresh().catch(()=>{})}} style={[s.tab,tab==="history"&&s.active]}><Text style={[s.tabText,tab==="history"&&s.activeText]}>Geçmiş</Text></Pressable>
      </View>
    </View>
    <FlatList
      data={data}
      keyExtractor={(item,index)=>`${item.id}:${index}`}
      renderItem={({item})=><TrackRow track={item} queue={data.filter(x=>!!x.streamUrl)}/>} 
      contentContainerStyle={s.list}
      ListEmptyComponent={<View style={s.empty}><Text style={s.emptyTitle}>{tab==="favorites"?"Henüz favorin yok":"Dinleme geçmişi boş"}</Text><Text style={s.emptyText}>{tab==="favorites"?"Parçaları favoriye ekledikçe burada göreceksin.":"Bir parça çaldığında otomatik kaydedilecek."}</Text></View>}
    />
  </View>
}

const s=StyleSheet.create({
  c:{flex:1,backgroundColor:colors.bg},header:{paddingTop:65,paddingHorizontal:17},h:{color:colors.text,fontSize:31,fontWeight:"900"},sub:{color:colors.muted,marginTop:5},tabs:{flexDirection:"row",gap:8,marginTop:18},tab:{paddingHorizontal:14,paddingVertical:9,borderRadius:999,backgroundColor:colors.card,borderWidth:1,borderColor:colors.line},active:{backgroundColor:colors.green,borderColor:colors.green},tabText:{color:colors.text,fontWeight:"800",fontSize:12},activeText:{color:"#090B0A"},list:{paddingHorizontal:17,paddingTop:12,paddingBottom:150},empty:{paddingTop:50,alignItems:"center"},emptyTitle:{color:colors.text,fontWeight:"900",fontSize:18},emptyText:{color:colors.muted,textAlign:"center",marginTop:8,lineHeight:20,maxWidth:280}
});
