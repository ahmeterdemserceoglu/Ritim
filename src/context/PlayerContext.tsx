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
 shuffle:boolean;repeat:RepeatMode;playbackRate:number;sleepEndsAt:number|null;crossfadeSeconds:number;
 playTrack:(t:Track,q?:Track[])=>Promise<void>;playRadio:(title:string,url:string,art?:string)=>Promise<void>;
 toggle:()=>void;seekTo:(s:number)=>Promise<void>;next:()=>Promise<void>;previous:()=>Promise<void>;
 setShuffle:(v:boolean)=>void;cycleRepeat:()=>void;setPlaybackRate:(v:number)=>void;setSleepTimer:(minutes:number|null)=>void;setCrossfadeSeconds:(v:number)=>void;
 enqueue:(t:Track)=>void;playNext:(t:Track)=>void;removeFromQueue:(id:string)=>void;clearQueue:()=>void;
};
const Context=createContext<C|null>(null);

export function PlayerProvider({children}:{children:React.ReactNode}){
 const playerA=useAudioPlayer(null,{updateInterval:250});const playerB=useAudioPlayer(null,{updateInterval:250});
 const statusA=useAudioPlayerStatus(playerA);const statusB=useAudioPlayerStatus(playerB);
 const[slot,setSlot]=useState<0|1>(0);const[currentTrack,setCurrentTrack]=useState<Track|null>(null);const[queue,setQueue]=useState<Track[]>([]);
 const[shuffle,setShuffleState]=useState(false);const[repeat,setRepeat]=useState<RepeatMode>('off');const[playbackRate,setRateState]=useState(1);const[crossfadeSeconds,setCrossfadeState]=useState(0);const[sleepEndsAt,setSleepEndsAt]=useState<number|null>(null);
 const transitionRef=useRef(false);const lastTrackRef=useRef<Track|null>(null);const pendingAutoRef=useRef<string|null>(null);
 const activePlayer=slot===0?playerA:playerB;const inactivePlayer=slot===0?playerB:playerA;const status=slot===0?statusA:statusB;

 useEffect(()=>{
  initDatabase().then(async()=>{
   const[savedQueue,savedTrack,savedShuffle,savedRepeat,prefs]=await Promise.all([getState<Track[]>('queue'),getState<Track>('currentTrack'),getState<boolean>('shuffle'),getState<RepeatMode>('repeat'),loadPreferences()]);
   if(savedQueue?.length)setQueue(savedQueue);if(savedTrack)setCurrentTrack(savedTrack);if(savedShuffle!=null)setShuffleState(savedShuffle);if(savedRepeat)setRepeat(savedRepeat);setRateState(prefs.playbackRate||1);setCrossfadeState(Math.max(0,Math.min(12,prefs.crossfadeSeconds||0)));
  }).catch(()=>{});
  setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:true,interruptionMode:'doNotMix'}).catch(()=>{});
 },[]);
 useEffect(()=>{setState('queue',queue).catch(()=>{})},[queue]);
 useEffect(()=>{if(currentTrack)setState('currentTrack',currentTrack).catch(()=>{})},[currentTrack]);
 useEffect(()=>{if(currentTrack&&Math.floor(status.currentTime||0)%5===0)setState('position',status.currentTime||0).catch(()=>{})},[status.currentTime,currentTrack?.id]);
 useEffect(()=>{setState('shuffle',shuffle).catch(()=>{})},[shuffle]);useEffect(()=>{setState('repeat',repeat).catch(()=>{})},[repeat]);
 useEffect(()=>{if(!sleepEndsAt)return;const ms=sleepEndsAt-Date.now();if(ms<=0){playerA.pause();playerB.pause();setSleepEndsAt(null);return;}const id=setTimeout(()=>{playerA.pause();playerB.pause();setSleepEndsAt(null)},ms);return()=>clearTimeout(id)},[sleepEndsAt]);

 const metadata=(t:Track)=>({title:t.title,artist:t.artist,albumTitle:t.album,artworkUrl:t.artworkUrl});
 const lockOptions=(t:Track)=>({isLiveStream:t.source==='radio'||t.artist==='Canlı Radyo',showSeekBackward:t.source!=='radio'&&t.artist!=='Canlı Radyo',showSeekForward:t.source!=='radio'&&t.artist!=='Canlı Radyo'});
 const finalizePrevious=(next?:Track)=>{const prev=lastTrackRef.current;if(!prev)return;const seconds=Math.max(0,status.currentTime||0),completed=!!status.didJustFinish||((status.duration||0)>0&&seconds/(status.duration||1)>.85),skipped=!completed&&!!next&&seconds<30;updateTrackOutcome(trackFingerprint(prev),seconds,completed,skipped).catch(()=>{})};

 const ramp=async(from:any,to:any,seconds:number)=>{
  const duration=Math.max(.1,seconds)*1000,step=50,start=Date.now();
  await new Promise<void>(resolve=>{const id=setInterval(()=>{const p=Math.min(1,(Date.now()-start)/duration);try{from.volume=1-p;to.volume=p}catch{}if(p>=1){clearInterval(id);resolve()}},step)});
 };

 const startOnSlot=async(t:Track,q?:Track[],fade=true)=>{
  const uri=await resolvePlayableUri(t);if(!uri)return;
  const hasCurrent=!!currentTrack&&!!status.playing;finalizePrevious(t);if(q)setQueue(q);
  if(hasCurrent&&fade&&crossfadeSeconds>0&&t.source!=='radio'&&currentTrack?.source!=='radio'){
   transitionRef.current=true;const from=activePlayer,to=inactivePlayer;try{to.replace(uri);to.volume=0;to.setPlaybackRate(playbackRate);to.setActiveForLockScreen(true,metadata(t),lockOptions(t));to.play();await ramp(from,to,crossfadeSeconds);from.pause();from.volume=1;from.setActiveForLockScreen(false);setSlot(s=>s===0?1:0);setCurrentTrack(t);lastTrackRef.current=t;addHistory(trackFingerprint(t),t).catch(()=>{});}finally{transitionRef.current=false;pendingAutoRef.current=null}return;
  }
  activePlayer.pause();try{inactivePlayer.pause()}catch{}activePlayer.replace(uri);activePlayer.volume=1;activePlayer.setPlaybackRate(playbackRate);activePlayer.setActiveForLockScreen(true,metadata(t),lockOptions(t));activePlayer.play();setCurrentTrack(t);lastTrackRef.current=t;addHistory(trackFingerprint(t),t).catch(()=>{});pendingAutoRef.current=null;
 };
 const playTrack=async(t:Track,q?:Track[])=>startOnSlot(t,q,true);
 const playRadio=async(title:string,url:string,art?:string)=>playTrack({id:`radio:${title}:${url}`,source:'radio',title,artist:'Canlı Radyo',streamUrl:url,artworkUrl:art});
 const toggle=()=>{if(!currentTrack)return;if(status.playing){playerA.pause();playerB.pause()}else activePlayer.play()};
 const seekTo=async(s:number)=>activePlayer.seekTo(Math.max(0,s));
 const targetIndex=(d:number)=>{if(!currentTrack||!queue.length)return-1;const i=queue.findIndex(x=>x.id===currentTrack.id);if(shuffle&&queue.length>1){let t=i;while(t===i)t=Math.floor(Math.random()*queue.length);return t}let t=i<0?0:i+d;if(t<0)t=repeat==='all'?queue.length-1:0;if(t>=queue.length)return repeat==='all'?0:-1;return t};
 const move=async(d:number,auto=false)=>{if(!currentTrack||!queue.length)return;if(repeat==='one'&&d>0){await activePlayer.seekTo(0);activePlayer.play();return}const t=targetIndex(d);if(t<0){if(auto){activePlayer.pause();finalizePrevious()}return}await startOnSlot(queue[t],queue,auto||d>0)};

 useEffect(()=>{const duration=status.duration||0,current=status.currentTime||0;if(!currentTrack||transitionRef.current||crossfadeSeconds<=0||duration<=0||currentTrack.source==='radio'||repeat==='one')return;const remaining=duration-current;if(remaining>0&&remaining<=crossfadeSeconds+.25){const t=targetIndex(1);if(t<0)return;const id=queue[t]?.id;if(id&&pendingAutoRef.current!==id){pendingAutoRef.current=id;startOnSlot(queue[t],queue,true).catch(()=>{pendingAutoRef.current=null})}}},[status.currentTime,status.duration,currentTrack?.id,crossfadeSeconds,queue,shuffle,repeat]);
 useEffect(()=>{if(status.didJustFinish&&!transitionRef.current&&crossfadeSeconds<=0)move(1,true).catch(()=>{})},[status.didJustFinish,crossfadeSeconds]);

 const setShuffle=(v:boolean)=>setShuffleState(v);const cycleRepeat=()=>setRepeat(r=>r==='off'?'all':r==='all'?'one':'off');
 const setPlaybackRate=(v:number)=>{const safe=Math.max(.5,Math.min(2,v));setRateState(safe);try{playerA.setPlaybackRate(safe);playerB.setPlaybackRate(safe)}catch{}};
 const setSleepTimer=(minutes:number|null)=>setSleepEndsAt(minutes&&minutes>0?Date.now()+minutes*60_000:null);const setCrossfadeSeconds=(v:number)=>setCrossfadeState(Math.max(0,Math.min(12,v)));
 const enqueue=(t:Track)=>setQueue(q=>[...q,t]);const playNext=(t:Track)=>setQueue(q=>{if(!currentTrack)return[t,...q];const i=q.findIndex(x=>x.id===currentTrack.id),copy=[...q];copy.splice(Math.max(0,i+1),0,t);return copy});const removeFromQueue=(id:string)=>setQueue(q=>q.filter(x=>x.id!==id));const clearQueue=()=>setQueue(currentTrack?[currentTrack]:[]);
 const value=useMemo(()=>({currentTrack,queue,isPlaying:!!status.playing,currentTime:status.currentTime||0,duration:status.duration||0,shuffle,repeat,playbackRate,sleepEndsAt,crossfadeSeconds,playTrack,playRadio,toggle,seekTo,next:()=>move(1),previous:()=>move(-1),setShuffle,cycleRepeat,setPlaybackRate,setSleepTimer,setCrossfadeSeconds,enqueue,playNext,removeFromQueue,clearQueue}),[currentTrack,queue,status.playing,status.currentTime,status.duration,status.didJustFinish,shuffle,repeat,playbackRate,sleepEndsAt,crossfadeSeconds,slot]);
 return <Context.Provider value={value}>{children}</Context.Provider>
}
export function usePlayer(){const v=useContext(Context);if(!v)throw new Error('usePlayer, PlayerProvider içinde kullanılmalı.');return v}
