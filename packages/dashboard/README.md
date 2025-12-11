# Tracker Hub Dashboard

Session replay ve telemetri monitoring için profesyonel React dashboard uygulaması.

## Özellikler

- 🎬 **Session Replay** - rrweb ile DOM event kayıt ve oynatma
- 📊 **Network Monitoring** - HTTP/WebSocket istek takibi
- 🔍 **Console Logs** - Hata ve log görüntüleyici
- 🤖 **AI Analiz** - Gemini ile otomatik hata analizi
- 📱 **Responsive** - Mobil uyumlu arayüz

## Teknolojiler

- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4
- rrweb-player
- Lucide React Icons

## Kurulum

```bash
# Bağımlılıkları yükle
pnpm install

# Development server
pnpm dev

# Production build
pnpm build
```

## Ortam Değişkenleri

`.env.local` dosyası oluşturun:

```env
VITE_API_URL=http://localhost:1337
GEMINI_API_KEY=your-api-key
```

## Proje Yapısı

```
src/
├── api/           # HTTP client ve endpoint'ler
├── components/    # React bileşenleri
├── config/        # Uygulama konfigürasyonu
├── constants/     # Sabit değerler
├── hooks/         # Custom React hooks
├── services/      # Harici servisler (Gemini)
├── store/         # State management (Context)
├── types/         # TypeScript tip tanımları
└── utils/         # Yardımcı fonksiyonlar
```

Detaylı mimari bilgisi için [ARCHITECTURE.md](./ARCHITECTURE.md) dosyasına bakın.

## Lisans

MIT
