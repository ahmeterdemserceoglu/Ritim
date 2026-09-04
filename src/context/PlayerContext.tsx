import React,{createContext,useContext,useEffect,useMemo,useState} from "react";
import {setAudioModeAsync,useAudioPlayer,useAudioPlayerStatus} from "expo-audio";
import type {Track} from "@/types/music";
import {trackFingerprint} from "@/lib/dedupe";
import {addHistory,getState,initDatabase,setState} from "@/storage/database";
import {resolvePlayableUri} from "@/services/downloadManager";

type RepeatMode="off"|"all"|"one";
type C={currentTrack:Track|null;queue:Track[];isPlaying:boolean;currentTime:number;duration:number;shuffle:boolean;repeat:RepeatMode;playTrack:(t:Track,q?:Track[])=>Promise<void>;playRadio:(title:string,url:string,art?:string)=>Promise<void>;toggle:()=>void;seekTo:(s:number)=>Promise<void>;next:()=>Promise<void>;previous:()=>Promise<void>;setShuffle:(v:boolean)=>void;cycleRepeat:()=>void};
const Context=createContext<C|null>(null);

export function PlayerProvider({children}:{children:React.ReactNode}){
  const player=useAudioPlayer(null,{updateInterval:500});
  const status=useAudioPlayerStatus(player);
  const[currentTrack,setCurrentTrack]=useState<Track|null>(null);
  const[queue,setQueue]=useState<Track[]>([]);
  const[shuffle,setShuffle]=useState(false);
  const[repeat,setRepeat]=useState<RepeatMode>("off");

  useEffect(()=>{
    initDatabase().then(async()=>{
      const savedQueue=await getState<Track[]>("queue");
      const savedTrack=await getState<Track>("currentTrack");
      if(savedQueue?.length)setQueue(savedQueue);
      if(savedTrack)setCurrentTrack(savedTrack);
    }).catch(()=>{});
    setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:true,interruptionMode:"doNotMix"}).catch(()=>{});
  },[]);

  useEffect(()=>{if(queue.length)setState("queue",queue).catch(()=>{})},[queue]);
  useEffect(()=>{if(currentTrack)setState("currentTrack",currentTrack).catch(()=>{})},[currentTrack]);

  const activateLockScreen=(t:Track)=>player.setActiveForLockScreen(true,{title:t.title,artist:t.artist,albumTitle:t.album,artworkUrl:t.artworkUrl});

  const playTrack=async(t:Track,q?:Track[])=>{
    const uri=await resolvePlayableUri(t);
    if(!uri)return;
    if(q)setQueue(q);
    setCurrentTrack(t);
    player.replace(uri);
    activateLockScreen(t);
    player.play();
    addHistory(trackFingerprint(t),t).catch(()=>{});
  };

  const playRadio=async(title:string,url:string,art?:string)=>playTrack({id:`radio:${title}:${url}`,source:"openverse",title,artist:"Canlı Radyo",streamUrl:url,artworkUrl:art});
  const toggle=()=>{if(!currentTrack)return;status.playing?player.pause():player.play()};
  const seekTo=async(s:number)=>player.seekTo(Math.max(0,s));

  const move=async(d:number)=>{
    if(!currentTrack||!queue.length)return;
    if(repeat==="one"){await player.seekTo(0);player.play();return;}
    const i=queue.findIndex(x=>x.id===currentTrack.id);
    let target=0;
    if(shuffle&&queue.length>1){
      do{target=Math.floor(Math.random()*queue.length)}while(target===i);
    }else{
      target=i<0?0:i+d;
      if(target<0)target=repeat==="all"?queue.length-1:0;
      if(target>=queue.length)target=repeat==="all"?0:queue.length-1;
    }
    await playTrack(queue[target],queue);
  };

  useEffect(()=>{
    if(status.didJustFinish)move(1).catch(()=>{});
  },[status.didJustFinish]);

  const cycleRepeat=()=>setRepeat(r=>r==="off"?"all":r==="all"?"one":"off");
  const value=useMemo(()=>({currentTrack,queue,isPlaying:!!status.playing,currentTime:status.currentTime||0,duration:status.duration||0,shuffle,repeat,playTrack,playRadio,toggle,seekTo,next:()=>move(1),previous:()=>move(-1),setShuffle,cycleRepeat}),[currentTrack,queue,status.playing,status.currentTime,status.duration,status.didJustFinish,shuffle,repeat]);
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function usePlayer(){const v=useContext(Context);if(!v)throw new Error("usePlayer, PlayerProvider içinde kullanılmalı.");return v}
