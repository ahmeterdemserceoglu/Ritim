import React,{createContext,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {setAudioModeAsync,useAudioPlayer,useAudioPlayerStatus} from 'expo-audio';
import type {Track} from '@/types/music';
import {trackFingerprint} from '@/lib/dedupe';
import {addHistory,getState,initDatabase,setState,updateTrackOutcome} from '@/storage/database';
import {resolvePlayableUri} from '@/services/downloadManager';
import {loadPreferences} from '@/services/preferences';

type RepeatMode='off'|'all'|'one';
type C={
 currentTrack:Track|null;queue:Track[];isPlaying:boolean;currentTime:number;duration:number;
 shuffle:boolean;repeat:RepeatMode;playbackRate:number;sleepEndsAt:number|null;
 playTrack:(t:Track,q?:Track[])=>Promise<void>;playRadio:(title:string,url:string,art?:string)=>Promise<void>;
 toggle:()=>void;seekTo:(s:number)=>Promise<void>;next:()=>Promise<void>;previous:()=>Promise<void>;
 setShuffle:(v:boolean)=>void;cycleRepeat:()=>void;setPlaybackRate:(v:number)=>void;setSleepTimer:(minutes:number|null)=>void;
 enqueue:(t:Track)=>void;playNext:(t:Track)=>void;removeFromQueue:(id:string)=>void;clearQueue:()=>void;
};
const Context=createContext<C|null>(null);

export function PlayerProvider({children}:{children:React.ReactNode}){
 const player=useAudioPlayer(null,{updateInterval:500});const status=useAudioPlayerStatus(player);
 const[currentTrack,setCurrentTrack]=useState<Track|null>(null);const[queue,setQueue]=useState<Track[]>([]);
 const[shuffle,setShuffleState]=useState(false);const[repeat,setRepeat]=useState<RepeatMode>('off');
 const[playbackRate,setRateState]=useState(1);const[sleepEndsAt,setSleepEndsAt]=useState<number|null>(null);
 const startPosition=useRef(0);const lastTrackRef=useRef<Track|null>(null);

 useEffect(()=>{
  initDatabase().then(async()=>{
   const[savedQueue,savedTrack,savedPos,savedShuffle,savedRepeat,prefs]=await Promise.all([
    getState<Track[]>('queue'),getState<Track>('currentTrack'),getState<number>('position'),getState<boolean>('shuffle'),getState<RepeatMode>('repeat'),loadPreferences()
   ]);
   if(savedQueue?.length)setQueue(savedQueue);if(savedTrack)setCurrentTrack(savedTrack);if(savedShuffle!=null)setShuffleState(savedShuffle);if(savedRepeat)setRepeat(savedRepeat);
   setRateState(prefs.playbackRate||1);startPosition.current=savedPos||0;
  }).catch(()=>{});
  setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:true,interruptionMode:'doNotMix'}).catch(()=>{});
 },[]);

 useEffect(()=>{setState('queue',queue).catch(()=>{})},[queue]);
 useEffect(()=>{if(currentTrack)setState('currentTrack',currentTrack).catch(()=>{})},[currentTrack]);
 useEffect(()=>{if(currentTrack&&Math.floor(status.currentTime||0)%5===0)setState('position',status.currentTime||0).catch(()=>{})},[status.currentTime,currentTrack?.id]);
 useEffect(()=>{setState('shuffle',shuffle).catch(()=>{})},[shuffle]);
 useEffect(()=>{setState('repeat',repeat).catch(()=>{})},[repeat]);

 useEffect(()=>{
  if(!sleepEndsAt)return;const ms=sleepEndsAt-Date.now();if(ms<=0){player.pause();setSleepEndsAt(null);return;}
  const id=setTimeout(()=>{player.pause();setSleepEndsAt(null)},ms);return()=>clearTimeout(id);
 },[sleepEndsAt]);

 const activateLockScreen=(t:Track)=>player.setActiveForLockScreen(true,{title:t.title,artist:t.artist,albumTitle:t.album,artworkUrl:t.artworkUrl},{isLiveStream:t.artist==='Canlı Radyo',showSeekBackward:t.artist!=='Canlı Radyo',showSeekForward:t.artist!=='Canlı Radyo'});

 const finalizePrevious=(next?:Track)=>{
  const prev=lastTrackRef.current;if(!prev)return;
  const seconds=Math.max(0,status.currentTime||0);const completed=!!status.didJustFinish||((status.duration||0)>0&&seconds/(status.duration||1)>.85);
  const skipped=!completed&&!!next&&seconds<30;
  updateTrackOutcome(trackFingerprint(prev),seconds,completed,skipped).catch(()=>{});
 };

 const playTrack=async(t:Track,q?:Track[])=>{
  const uri=await resolvePlayableUri(t);if(!uri)return;
  finalizePrevious(t);if(q)setQueue(q);setCurrentTrack(t);lastTrackRef.current=t;player.replace(uri);activateLockScreen(t);
  try{player.setPlaybackRate(playbackRate)}catch{}
  player.play();addHistory(trackFingerprint(t),t).catch(()=>{});
 };
 const playRadio=async(title:string,url:string,art?:string)=>playTrack({id:`radio:${title}:${url}`,source:'openverse',title,artist:'Canlı Radyo',streamUrl:url,artworkUrl:art});
 const toggle=()=>{if(!currentTrack)return;status.playing?player.pause():player.play()};
 const seekTo=async(s:number)=>player.seekTo(Math.max(0,s));

 const move=async(d:number)=>{
  if(!currentTrack||!queue.length)return;
  if(repeat==='one'&&d>0){await player.seekTo(0);player.play();return;}
  const i=queue.findIndex(x=>x.id===currentTrack.id);let target=0;
  if(shuffle&&queue.length>1){do{target=Math.floor(Math.random()*queue.length)}while(target===i)}else{target=i<0?0:i+d;if(target<0)target=repeat==='all'?queue.length-1:0;if(target>=queue.length){if(repeat==='all')target=0;else{player.pause();return;}}}
  await playTrack(queue[target],queue);
 };
 useEffect(()=>{if(status.didJustFinish)move(1).catch(()=>{})},[status.didJustFinish]);

 const setShuffle=(v:boolean)=>setShuffleState(v);
 const cycleRepeat=()=>setRepeat(r=>r==='off'?'all':r==='all'?'one':'off');
 const setPlaybackRate=(v:number)=>{const safe=Math.max(.5,Math.min(2,v));setRateState(safe);try{player.setPlaybackRate(safe)}catch{}};
 const setSleepTimer=(minutes:number|null)=>setSleepEndsAt(minutes&&minutes>0?Date.now()+minutes*60_000:null);
 const enqueue=(t:Track)=>setQueue(q=>[...q,t]);
 const playNext=(t:Track)=>setQueue(q=>{if(!currentTrack)return[t,...q];const i=q.findIndex(x=>x.id===currentTrack.id);const copy=[...q];copy.splice(Math.max(0,i+1),0,t);return copy});
 const removeFromQueue=(id:string)=>setQueue(q=>q.filter(x=>x.id!==id));
 const clearQueue=()=>setQueue(currentTrack?[currentTrack]:[]);

 const value=useMemo(()=>({currentTrack,queue,isPlaying:!!status.playing,currentTime:status.currentTime||0,duration:status.duration||0,shuffle,repeat,playbackRate,sleepEndsAt,playTrack,playRadio,toggle,seekTo,next:()=>move(1),previous:()=>move(-1),setShuffle,cycleRepeat,setPlaybackRate,setSleepTimer,enqueue,playNext,removeFromQueue,clearQueue}),[currentTrack,queue,status.playing,status.currentTime,status.duration,status.didJustFinish,shuffle,repeat,playbackRate,sleepEndsAt]);
 return <Context.Provider value={value}>{children}</Context.Provider>
}

export function usePlayer(){const v=useContext(Context);if(!v)throw new Error('usePlayer, PlayerProvider içinde kullanılmalı.');return v}
