import {Stack} from "expo-router";
import {StatusBar} from "expo-status-bar";
import {PlayerProvider} from "@/context/PlayerContext";
import {LibraryProvider} from "@/context/LibraryContext";
import {colors} from "@/theme";

export default function RootLayout(){
  return <PlayerProvider>
    <LibraryProvider>
      <StatusBar style="light"/>
      <Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.bg},animation:"slide_from_right"}}>
        <Stack.Screen name="(tabs)"/>
        <Stack.Screen name="player" options={{presentation:"modal",animation:"slide_from_bottom"}}/>
      </Stack>
    </LibraryProvider>
  </PlayerProvider>
}
