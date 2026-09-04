# Ritim

Android odaklı, Türkçe müzik dinleme ve keşif uygulaması.

## Teknoloji
- Expo SDK 57
- React Native 0.86
- Expo Router
- expo-audio
- Ücretsiz/anahtarsız veri kaynakları:
  - MusicBrainz
  - Openverse
  - Internet Archive
  - LRCLIB
  - Radio Browser

## Kurulum
```bash
npm install
npx expo install --fix
npx expo start
```

Android native geliştirme / APK:
```bash
npx expo prebuild
npx expo run:android
```

## Not
Bu proje yalnızca yasal olarak stream edilebilen açık lisanslı/public-domain içerikleri oynatmayı hedefler.
MusicBrainz metadata sağlar; ticari katalog için lisanslı sağlayıcı gerekir.
