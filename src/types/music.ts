export type TrackSource='openverse'|'internetarchive'|'musicbrainz'|'local'|'radio';
export type StreamAlternative={source:TrackSource;streamUrl:string;sourceScore?:number;license?:string};
export type Track={id:string;source:TrackSource;title:string;artist:string;album?:string;artworkUrl?:string;streamUrl?:string;duration?:number;isrc?:string;license?:string;bitrate?:number;codec?:string;format?:string;size?:number;sourceScore?:number;alternatives?:StreamAlternative[]};
export type RadioStation={id:string;name:string;streamUrl:string;favicon?:string;country?:string;tags?:string[];codec?:string;bitrate?:number};
