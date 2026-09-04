import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import type {Track} from '@/types/music';
import {listFavorites,listHistory,toggleFavorite as toggleFavoriteDb} from '@/storage/database';
import {trackFingerprint} from '@/lib/dedupe';
import {downloadTrack,removeDownload} from '@/services/downloadManager';

type LibraryContextValue={favorites:Track[];history:Track[];favoriteKeys:Set<string>;refresh:()=>Promise<void>;toggleFavorite:(track:Track)=>Promise<boolean>;download:(track:Track)=>Promise<string>;removeDownload:(track:Track)=>Promise<void>};
const Context=createContext<LibraryContextValue|null>(null);

export function LibraryProvider({children}:{children:React.ReactNode}){
  const[favorites,setFavorites]=useState<Track[]>([]);
  const[history,setHistory]=useState<Track[]>([]);
  const refresh=async()=>{const[f,h]=await Promise.all([listFavorites(),listHistory()]);setFavorites(f);setHistory(h)};
  useEffect(()=>{refresh().catch(()=>{})},[]);
  const toggleFavorite=async(track:Track)=>{const state=await toggleFavoriteDb(trackFingerprint(track),track);await refresh();return state};
  const download=async(track:Track)=>downloadTrack(track);
  const remove=async(track:Track)=>removeDownload(track);
  const favoriteKeys=useMemo(()=>new Set(favorites.map(trackFingerprint)),[favorites]);
  return <Context.Provider value={{favorites,history,favoriteKeys,refresh,toggleFavorite,download,removeDownload:remove}}>{children}</Context.Provider>
}

export function useLibrary(){const v=useContext(Context);if(!v)throw new Error('useLibrary, LibraryProvider içinde kullanılmalı.');return v}
