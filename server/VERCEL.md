# Ritim Server — Vercel

Fastify sunucusu Vercel'in yerel Fastify desteğiyle deploy edilebilir.

## Vercel panelinden
1. New Project → Import Git Repository.
2. `ahmeterdemserceoglu/Ritim` reposunu seç.
3. **Root Directory** alanını `server` yap.
4. Framework preset'i otomatik algılanabilir; özel build command gerekmez.
5. Deploy'a bas.
6. Deploy sonrası `/health` endpointini aç. `ok: true` dönmeli.

Örnek:
`https://PROJE-ADIN.vercel.app/health`

Ardından Android uygulamasında:
Ayarlar → Ritim Server → `https://PROJE-ADIN.vercel.app`

## Vercel notu
Vercel Functions kalıcı yerel disk sağlamaz. Ritim bu ortamda cache için memory + `/tmp` kullanır. Instance yeniden oluşturulduğunda bu cache kaybolabilir; uygulamanın çalışmasını etkilemez, sadece kaynak API'lerine yeniden istek atılır.

## Endpointler
- `GET /health`
- `GET /v1/search?q=`
- `GET /v1/resolve?q=`
- `GET /v1/artist?name=`
- `GET /v1/releases?artistId=`
- `GET /v1/release-tracks?id=`
- `GET /v1/lyrics?track=&artist=`
- `GET /v1/radio?q=`
- `GET /v1/cache/stats`
- `GET /v1/source-health`
