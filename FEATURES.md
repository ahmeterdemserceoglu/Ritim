# Ritim — Özellik Matrisi

## Çalışan çekirdek
- Tek kullanıcı / auth yok / local-first
- Expo SDK 57 + React Native 0.86
- Background playback, lock-screen metadata ve medya kontrolleri
- Kalıcı current track / queue / position / shuffle / repeat
- Dual-player crossfade (0-12 sn) ve normal geçiş
- Playback rate, sleep timer, haptics
- Mini-player progress, full-player swipe gestures, blurred artwork
- Queue: next, enqueue, remove, clear
- Stream error recovery ve alternatif URL fallback
- Permanent offline downloads + resumable queue + progress + pause/resume/cancel + Wi-Fi-only
- Smart LRU cache ve storage limit
- Favorites, history, listening analytics, playlists, blacklist
- Smart mixes ve personalized Discovery Radio
- Search debounce, recent searches, local cache, dedupe, source scoring
- Quality preference (high/auto/data-saver), bitrate/FLAC/source priority scoring
- Openverse + Internet Archive + MusicBrainz
- LRCLIB synchronized lyrics, active-line scroll, tap-to-seek
- Radio Browser host fallback, codec + bitrate filters
- Artist profile, diskography, album pages, Cover Art Archive
- Genre discovery pages
- Local Android audio library scan
- Backup + latest-backup restore
- Runtime-configurable Ritim Server URL
- Server persistent disk cache, rate limit, source health score, resolver, catalog, lyrics, radio APIs
- Diagnostics
- System EQ / Bluetooth / battery optimization shortcuts
- Android home widget media controls
- Android Quick Settings play/pause tile
- Deep-link scheme: ritim://

## Native build/device validation required
- Widget and Quick Settings tile are produced by `plugins/withRitimAndroidMedia.js` during `expo prebuild`.
- Android Auto media-app metadata is generated, but a fully browseable Android Auto MediaLibraryService synchronized with the JS queue still requires native-device integration testing before it can be called complete.
- System equalizer behavior depends on the Android/OEM audio-effects implementation.
- True ReplayGain/loudness normalization and in-app bass/parametric EQ require a native DSP/audio-session module; the current toggle is preference infrastructure, not a claim of completed DSP normalization.
- Headset/Bluetooth disconnect and audio focus primarily use Android/Expo Audio media-session behavior and must be tested on physical devices.

## Deliberately not faked
- A Shazam-class recognizer cannot be honestly provided keyless for arbitrary commercial music without an acoustic-fingerprint catalog. Ritim does not pretend to have one.
- Last.fm scrobbling is not enabled by default because it requires a Last.fm account/API credentials, conflicting with the zero-login/keyless default goal.
- A free/keyless app cannot legally expose Spotify's complete mainstream commercial catalog on-demand. Ritim uses legal/open sources and local media.

## Validation
`.github/workflows/ci.yml` performs Expo dependency check, TypeScript check and Node server syntax validation when GitHub Actions runs.
