# STUDY PLAZA 3D — Friends Edition ☁️

**Arkadaşlarla 3D dünyada ders çalışmak ve mola oyunları oynamak için hazırlanmış çalışan beta web uygulaması.**

## Hızlı başlangıç (Windows)

1. Bilgisayarında **Node.js 18+** kurulu olsun: https://nodejs.org/.
2. ZIP'i bilgisayarında **Tümünü ayıkla** ile bir klasöre çıkar. ZIP'in içinden doğrudan çalıştırma.
3. Çıkarılan `Study_Plaza_3D_Fixed` klasöründeki `START_WINDOWS.bat` dosyasına çift tıkla.
4. Başlatıcı sunucu hazır olduğunda tarayıcıyı **http://127.0.0.1:4174** adresinde açacak.
5. İsmini yaz, **Kendi dünyanı oluştur** düğmesine bas.
6. Sağ üstten **Davet et** düğmesiyle oda kodunu veya bağlantıyı arkadaşına gönder.

Mac / Linux: klasörde `node server.mjs` veya `./start_mac_linux.sh`.

> **Önemli:** `localhost` yalnızca çalıştıran kişinin bilgisayarında açılır. Arkadaşlarınız farklı evlerden katılacaksa bu Node.js sunucusunu internetten erişilebilir bir yere yayımlamalısınız. Aynı Wi-Fi ağında olanlar sunucuyu çalıştıran cihazın yerel IP adresi ve `4173` portuyla bağlanabilir (güvenlik duvarı izinleri gerekebilir). Uygulama henüz çevrimiçi barındırılmamaktadır.

## Özellikler

| Sistem | Durum |
| --- | --- |
| **Gerçek 3D dünyada WASD ile dolaşma** | ✅ WebGL + WebGL olmayan cihazlarda perspektifli Canvas yedeği |
| **4 farklı ortam** (Sky Garden, Cloud Library, Sunny Cove, Moonlight Camp) | ✅ Oda kurucusu seçer; herkeste güncellenir |
| **Arkadaş odası ve canlı oyuncu pozisyonları** | ✅ 6 karakterli kod, en çok 8 oyuncu |
| **3D karakter, 5 renk, 6 şapka** | ✅ Şapkalar 3D avatar üzerinde görünür |
| **Ortak çalışma süresi** | ✅ 15/25/40/50 dakika ve kısa test modu |
| **Ders ve konu ekleme** | ✅ Paylaşılan konu ilerlemesi |
| **İnteraktif ders kartları** | ✅ Konu metni, kendi kontrol sorusu ve cevap açma |
| **Quiz Arenası** | ✅ Eşzamanlı sorular, kendi sorunu ekleme, cevap açıklama |
| **Memory Flip** | ✅ 12 kartlık eşleştirme oyunu |
| **Math Blitz** | ✅ 30 saniyelik hesap yarışması |
| **Star Dash 3D** | ✅ 60 saniyede 3D alanda yıldız toplama |
| **XO Düellosu** | ✅ İki gerçek oda oyuncusu, sıralı hamleler |
| **Sohbet, Study Coins ve şapka mağazası** | ✅ Temel sürüm |

### 3D kontroller
- `W / A / S / D` veya yön tuşları: hareket
- Fareyle sahnede sürükle: kamerayı döndür
- Fare tekerleği: kamerayı yakınlaştır / uzaklaştır
- `E`: yakındaki ders masası, quiz arenası, oyun alanı veya dolabı aç
- Mobilde sol altta yön tuşları bulunur.

### Ders ekleme
**Dersler → Ders ekle → Konu ekle → Aç → Not / soru ekle.** Böylece öğretmeninizin konularını kendi odanızda interaktif tekrar kartına dönüştürebilirsiniz. Her oyuncu ilerlemeyi aynı panodan görür.

### Arkadaşlarla ders yapma akışı
1. Ortam seç (ör. Cloud Library).
2. Dersleri ve konuları ekle.
3. 25 dakikalık ortak odak turunu başlat.
4. Kendi notlarınızı okuyun, konuyu tamamlayın.
5. Quiz Arenası'ndan beraber test çözün.
6. Mola sırasında 4 oyundan birini oynayın.
7. Kazanılan Study Coins ile şapka açın.

## Teknik bilgiler

- Sıfır üçüncü taraf bağımlılık, `npm install` gerekmiyor.
- Gerçek 3D sahne WebGL ile çizilir; WebGL kapalıysa kendi perspektif çizicisi yedek olarak devreye girer.
- Sunucu Node.js `http` + Server-Sent Events kullanır.
- Odalar `data/rooms.json` içinde saklanır. Sunucuyu internette barındırırsanız **kalıcı disk alanı** gerekir; geçici dosya sistemlerinde oda verileri kaybolabilir.
- Geliştirme amaçlı beta; kimlik doğrulama, içerik moderasyonu, spam önleme ve ölçeklenebilirlik gibi üretim özellikleri henüz tamamlanmış değildir.
- Kullanılan atmosfer Wii konsollarının ferah ve sosyal tasarım yaklaşımından ilham alır; Nintendo logoları, karakterleri veya lisanslı varlıkları kullanılmaz.

## Geliştirme

```bash
node server.mjs
# http://localhost:4173
```

`PORT=4180 node server.mjs` ile port değiştirilebilir. Sağlık kontrolü: `GET /api/health`.

**Dosyalar:** `index.html` (arayüz), `style.css` (tasarım), `world.js` (3D engine), `app.js` (uygulama), `server.mjs` (oda sunucusu).


## Açılmıyorsa
- **ZIP açılmıyor:** İndirilen dosyaya sağ tık > Tümünü ayıkla. Windows Gezgininde dosya adı sonunda .zip olduğundan emin ol.
- **İndex.html açılıyor ama oda oluşturmuyor:** Index.html dosyasını çift tıklama; `START_WINDOWS.bat` ile başlatmak gerekir.
- **Node.js bulunamadı:** nodejs.org üzerinden Windows için LTS kur, yeniden başlatıcıya çift tıkla.
- **Windows koruma ekranı:** Sadece kaynağına güvendiğin dosyalar için çalıştırma izni ver.
- **Tarayıcı açılmazsa:** Başlatıcı açıkken `http://127.0.0.1:4174` adresini elle gir.
- **Hata sürerse:** `Study Plaza 3D Server` adlı komut penceresindeki hata metnini paylaş.
