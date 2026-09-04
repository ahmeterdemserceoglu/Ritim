export type TrackSource="openverse"|"internetarchive"|"musicbrainz";
export type Track={id:string;source:TrackSource;title:string;artist:string;album?:string;artworkUrl?:string;streamUrl?:string;duration?:number;isrc?:string;license?:string};
export type RadioStation={id:string;name:string;streamUrl:string;favicon?:string;country?:string;tags?:string[]};
