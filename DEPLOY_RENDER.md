# Study Plaza 3D — Render yayına alma

## Tek seferlik kurulum
1. GitHub'da yeni bir repository oluştur (`study-plaza-3d`), tercihen **Private**; mümkünse yeni repository'yi Github connector ile erişilebilir hâle getir.
2. `Study_Plaza_3D_Fixed` klasöründeki kaynak kodlarını repository köküne koy. Yalnızca ZIP dosyasını yüklemek yeterli değildir: `server.mjs`, `app.js`, `world.js`, `index.html`, `style.css`, `package.json` ve `render.yaml` doğrudan repository'de olmalı.
3. Render hesabında **New > Blueprint** üzerinden bu GitHub repository'yi bağla. `render.yaml` tek bir web servisi tanımlar, ücretsiz planı seçer ve uygulamayı Node.js ile başlatır.
4. Deploy `Live` olduktan sonra Render'ın verdiği `https://...onrender.com` linkinden gir. Arkadaşların aynı adrese girip oda kodu ile katılır. ZIP/Node kurulumu gerekmez.

## Kontrol listesi
- `GET /api/health` -> `{ "ok": true, ... }`
- Ana sayfa açılıyor mu?
- Oda açma ve bir başka tarayıcıdan oda koduyla katılma çalışıyor mu?
- Ortam değiştirme iki tarayıcıda da görünüyor mu?

## Beta uyarıları
- Render ücretsiz planda sunucu bir süre kullanılmazsa uyku moduna geçebilir; ilk açılış uzayabilir.
- Bu sürüm `data/rooms.json` içinde saklar; Render'ın ücretsiz/ephemeral dosya sisteminde yeniden dağıtımda oda verileri kaybolabilir. Uzun süreli kullanım için kalıcı veritabanına geçilmelidir.
- Bu beta kimlik doğrulama, moderasyon ve kötüye kullanım korumaları açısından üretime hazır değildir. Kodu yalnızca güvendiğiniz arkadaşlarınızla paylaşın.
