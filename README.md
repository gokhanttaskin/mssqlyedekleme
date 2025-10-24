# MSSQL Yedekleme Desktop Uygulaması

[![ff}](https://i.hizliresim.com/f9ir5da.png)](https://hizliresim.com/f9ir5da)

Modern bir React + Electron masaüstü uygulaması. SQL Server (MSSQL) sunucunuza bağlanır, kullanıcı veritabanlarını listeler, yedekleme hedef klasörünü seçtirir ve tek tuşla `.bak` dosyası üretir.

## Özellikler
- Sunucuya bağlanma: `HOST` veya `HOST\\INSTANCE` formatında bağlanma.
- Kullanıcı veritabanlarını listeleme: Sistem DB’leri otomatik gizli (`master`, `model`, `msdb`).
- Arama, sıralama, sayfalama: Veritabanı tablosunda hızlı filtreleme.
- Çoklu seçim: Birden fazla veritabanını aynı anda yedekleme.
- Hedef klasör seçimi: Sistem klasör seçici veya manuel path girme.
- Yedekleme çıktısı: Her DB için ayrı başarı/başarısızlık sonucu, dosya yolu ve hata ayrıntıları.
- Zaman aşımı iyileştirmeleri: Büyük DB’lerde yedekleme için yükseltilmiş timeout değerleri.
- Geliştirici deneyimi: DevTools varsayılan olarak kapalı, istenirse açılabilir.

## Teknolojiler
- Frontend: React, Vite, Material UI
- Desktop: Electron
- MSSQL: `mssql` Node.js sürücüsü

## Kurulum
```bash
# Proje dizinine geçin
cd frontend

# Bağımlılıkları yükleyin
npm install
```

## Geliştirme
```bash
# Geliştirme sunucusunu ve Electron’u başlatır
npm run dev

# İsteğe bağlı: DevTools’u açmak için
OPEN_DEVTOOLS=1 npm run dev
```
- Varsayılan olarak Vite `5174` portunu hedefler; doluysa bir sonraki boş port (örn. `5175`) seçilebilir.
- Geliştirme sırasında uygulama `http://localhost:<port>/` üzerinde çalışır.

## Paketleme (Build)
> Not: Basit geliştirme akışı için `npm run dev` yeterlidir. Üretim paketlemesi eklenebilir (ör. `electron-builder`). Bu depoda öncelik dev akışıdır.

## Kullanım
1. “Bağlantı” adımında sunucu, kullanıcı adı ve şifreyi girin.
   - Sunucu: `HOST` veya `HOST\\INSTANCE` (ör. `SRV01\\SQL2019`)
2. “Veritabanları” adımında liste otomatik gelir; arama kutusuyla filtreleyin.
   - Sistem DB’leri (`master`, `model`, `msdb`) görünmez.
3. “Hedef Klasör” adımında yedekleme klasörünü seçin veya girin.
4. “Yedekleme” adımında “Seçili Veritabanlarını Yedekle” butonuna basın.
   - İlerleme ve sonuçlar kartlarda anlık görüntülenir.

## Önemli Notlar
- Yedek dosya yolu, SQL Server servis hesabınca yazılabilir olmalıdır.
  - Örnek doğru yollar:
    - Yerel disk: `C:\\SQLBackups\\MyDb_YYYYMMDD_HHMMSS.bak`
    - UNC paylaşım: `\\\\fileserver\\backupshare\\MyDb_YYYYMMDD_HHMMSS.bak`
- `BACKUP DATABASE` komutu `WITH INIT` kullanır; mevcut dosyayı yeniden yazar.
- `COMPRESSION` seçeneği uyumluluk için kaldırılmıştır (Edition/izin sorunları önlemek adına).
- Büyük veritabanlarında zaman aşımı sorunlarını önlemek için şu değerler uygulanır:
  - `connectionTimeout: 60000` (bağlantı kurulumu için 60 sn)
  - `requestTimeout: 600000` (tek yedekleme isteği için 10 dk)
  - Her yedek çağrısında `request.timeout = 600000`
- Named instance desteği: `HOST\\INSTANCE` girildiğinde dinamik port kullanılır.

## Sık Karşılaşılan Hatalar ve Çözümler
- “BACKUP DATABASE is terminating abnormally”
  - Genelde hedef yol/izin problemidir. Hedef klasörün SQL Server servis hesabınca yazılabilir olduğundan emin olun.
- “Timeout: Request failed to complete in 15000ms”
  - Büyük DB’lerde varsayılan 15 sn yetersizdir. Uygulamada süreler yükseltildi; hâlâ olursa daha da arttırılabilir.
- “The backup or restore was aborted”
  - Çoğunlukla izin veya kilitli dosya/yol hatası. Dosya yolunu ve paylaşımları kontrol edin.

## Proje Yapısı (frontend)
```
frontend/
  electron/
    main.cjs        # Electron ana süreç; MSSQL bağlantı ve yedekleme mantığı
    preload.cjs     # Renderer ile IPC köprüsü
  src/
    ui/             # React UI (MUI ile)
    main.tsx        # React giriş
  package.json      # Script’ler ve bağımlılıklar
```

## Katkı ve Lisans
- Her türlü katkıya açıktır; PR açabilirsiniz.
- Lisans: MIT (repo kökünde LICENSE mevcut).
