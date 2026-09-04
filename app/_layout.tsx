import {useEffect} from 'react';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {PlayerProvider} from '@/context/PlayerContext';
import {LibraryProvider} from '@/context/LibraryContext';
import {warmSmartCache} from '@/services/smartCache';
import {colors} from '@/theme';
export default function RootLayout(){useEffect(()=>{const id=setTimeout(()=>warmSmartCache(10).catch(()=>{}),2500);return()=>clearTimeout(id)},[]);return <PlayerProvider><LibraryProvider><StatusBar style="light"/><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.bg},animation:'slide_from_right'}}><Stack.Screen name="(tabs)"/><Stack.Screen name="player" options={{presentation:'modal',animation:'slide_from_bottom'}}/></Stack></LibraryProvider></PlayerProvider>}
