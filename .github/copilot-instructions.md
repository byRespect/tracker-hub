# Tracker Hub - Copilot Instructions

## Proje Hakkında

Tracker Hub, kullanıcı oturumlarını kaydeden ve analiz eden bir telemetri platformudur.

## Monorepo Yapısı

- `packages/core` - TypeScript tracker kütüphanesi
- `packages/frontend` - React demo uygulaması
- `packages/backend` - NestJS API sunucusu
- `packages/dashboard` - React admin paneli

## Teknolojiler

- **Package Manager**: pnpm (workspace)
- **Build**: TypeScript, Vite
- **Frontend**: React 19, Tailwind CSS v4
- **Backend**: NestJS, MongoDB
- **Session Replay**: rrweb

## Geliştirme Komutları

```bash
# Tüm paketleri derle
pnpm build

# Dashboard geliştirme
pnpm --filter dashboard dev

# Backend başlat
pnpm --filter backend start:dev
```

## Kod Standartları

- TypeScript strict mode
- Türkçe yorumlar, İngilizce teknik terimler
- Component'ler için React.FC<Props> pattern
- API çağrıları api/ klasöründen
- State yönetimi store/ klasöründen

## Dashboard Mimarisi

```
dashboard/src/
├── api/        # HTTP client, endpoints
├── components/ # React bileşenleri
├── config/     # Uygulama ayarları
├── hooks/      # Custom hooks
├── store/      # Context + Reducer
├── types/      # TypeScript tipleri
└── utils/      # Yardımcı fonksiyonlar
```

## Kurallar

- classnames ve style'ları değiştirme (Tailwind sınıfları)
- Yeni component eklerken types/ altına tip tanımı ekle
- API çağrısı eklerken api/sessions.ts'e endpoint ekle
- Hook eklerken hooks/index.ts'den export et
