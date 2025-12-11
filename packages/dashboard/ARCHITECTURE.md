# Dashboard Proje Mimarisi

## Genel Bakış

Dashboard, açık kaynak dağıtım için tasarlanmış profesyonel bir React + TypeScript telemetri ve session monitoring uygulamasıdır. Gerçek zamanlı session replay, network monitoring, console logging ve analitik görselleştirme özellikleri sunar.

## Proje Yapısı

```
packages/dashboard/
├── src/
│   ├── api/                        # Backend iletişimi
│   │   ├── client.ts              # HTTP client (fetch wrapper)
│   │   ├── sessions.ts            # Session API endpoint'leri
│   │   └── index.ts               # Public exports
│   ├── components/                 # React bileşenleri
│   │   ├── DashboardPanel/        # Dashboard container
│   │   │   ├── StatCard.tsx       # Metrik kartları
│   │   │   ├── SessionCard.tsx    # Session kartı
│   │   │   ├── DeleteConfirmationModal.tsx
│   │   │   └── index.ts
│   │   ├── ConsolePanel.tsx       # Console logs görüntüleyici
│   │   ├── NetworkPanel.tsx       # Network istekleri
│   │   ├── SessionPanel.tsx       # rrweb replay
│   │   ├── OverviewPanel.tsx      # Session analitikleri
│   │   └── ...
│   ├── config/                     # Uygulama konfigürasyonu
│   │   └── index.ts               # API URL, pagination ayarları
│   ├── constants/                  # Sabit değerler
│   │   └── index.ts               # APP_CONFIG, renk varyantları
│   ├── hooks/                      # Custom React hooks
│   │   ├── useSessionActions.ts   # Session CRUD işlemleri
│   │   ├── usePagination.ts       # Pagination state yönetimi
│   │   └── index.ts
│   ├── services/                   # Harici servisler
│   │   └── geminiService.ts       # AI hata analizi
│   ├── store/                      # State management
│   │   ├── sessionStore.ts        # Reducer ve action'lar
│   │   ├── SessionContext.tsx     # React Context provider
│   │   └── index.ts
│   ├── types/                      # TypeScript tip tanımları
│   │   ├── session.ts             # Session, UserInfo
│   │   ├── console.ts             # ConsoleLog, LogLevel
│   │   ├── network.ts             # NetworkLog, NetworkMeta
│   │   ├── dom.ts                 # DOMEvent
│   │   ├── analytics.ts           # SessionAnalytics
│   │   ├── common.ts              # PaginationMeta, ViewMode
│   │   └── index.ts               # Tüm export'lar
│   ├── utils/                      # Yardımcı fonksiyonlar
│   │   ├── analytics.ts           # Analitik hesaplamaları
│   │   ├── formatters.ts          # Tarih, sayı formatlama
│   │   └── index.ts
│   ├── App.tsx                     # Root component
│   ├── index.tsx                   # Entry point
│   ├── index.css                   # Global stiller (Tailwind)
│   └── global.d.ts                 # TypeScript declarations
├── vite.config.ts                 # Vite konfigürasyonu
├── tsconfig.json                  # TypeScript config
├── postcss.config.cjs             # PostCSS (Tailwind v4)
└── package.json
```

## Temel Tasarım Prensipleri

### 1. **Modüler Yapı**

- **api/**: Tüm backend iletişimi merkezi HTTP client üzerinden
- **store/**: useReducer + Context pattern ile state management
- **types/**: Domain'e göre ayrılmış tip tanımları
- **hooks/**: Context'i consume eden reusable hook'lar

### 2. **Sorumluluk Ayrımı**

- **Components**: Sadece UI render
- **Hooks**: State ve side effect yönetimi
- **Store**: Global state (sessions, pagination)
- **API**: Network istekleri
- **Utils**: Pure hesaplama fonksiyonları

### 3. **Tip Güvenliği**

- Tüm component'ler `React.FC<Props>` ile tanımlı
- Domain bazlı tip dosyaları (session.ts, network.ts, ...)
- Strict TypeScript konfigürasyonu

## Bileşen Detayları

### DashboardPanel

**Amaç**: Session listesi ve genel metrikleri gösteren ana dashboard view'ı.

**Alt Bileşenler**:
- `StatCard`: Metrik kartları (requests, logs, errors)
- `SimpleSparkline`: Traffic volume grafiği
- `SessionCard`: Grid'deki session kartları
- `DeleteConfirmationModal`: Silme onay dialog'u

### SessionContext

**Amaç**: Global session state yönetimi.

**Sağladığı Değerler**:
- `state`: Sessions, activeSessionId, loading, error, pagination
- `fetchSessions`: Session listesini yükle
- `createSession`: Yeni session oluştur
- `switchSession`: Session detaylarını yükle
- `deleteSession`: Session sil
- `currentSession`: Aktif session objesi

### ConsolePanel

**Amaç**: Console log'ları görüntüleyici ve AI hata analizi.

**Features**:
- Expandable log entries
- Error/warning filtering
- Pagination support
- AI-powered error analysis (via Gemini)

### NetworkPanel

**Purpose**: Network requests monitoring.

**Features**:
- Request filtering and search
- Response preview
- Pagination
- Performance metrics

## Styling

- **Framework**: Tailwind CSS v4
- **Dark Theme**: Custom dark palette (`#020617` background)
- **Responsive**: Mobile-first design with responsive grid layouts
- **Glassmorphism**: Subtle glass effect on cards and modals

**Note**: All class names and styling are untouched for design consistency.

## Data Flow

```
App.tsx (Root)
  ├── DashboardPanel (Sessions List)
  │   ├── StatCard (Metrics)
  │   ├── SimpleSparkline (Chart)
  │   └── SessionCard (Individual Sessions)
  │
  └── SessionPanel (Session Detail)
      ├── Timeline (DOM Events)
      ├── ConsolePanel (Logs)
      ├── NetworkPanel (Requests)
      └── OverviewPanel (Analytics)
```

## Configuration & Constants

### App Config (`constants/index.ts`)

```typescript
export const APP_CONFIG = {
  VERSION: '2.4.0',
  STATUS: 'Stable',
  SYSTEM_STATUS: 'System Online',
};
```

### Pagination Settings

```typescript
export const PAGINATION = {
  DEFAULT_LIMIT: 12,
  MIN_LIMIT: 5,
  MAX_LIMIT: 50,
};
```

### Traffic Volume Buckets

```typescript
export const TRAFFIC_VOLUME = {
  BUCKET_COUNT: 30,
  BUFFER_PERCENTAGE: 0.05,
  MIN_DURATION: 1000,
};
```

All magic numbers and configuration values are extracted to `constants/index.ts` for maintainability.

## Utilities

### Analytics (`utils/analytics.ts`)

- `generateSessionAnalytics()`: Converts raw session data to aggregated analytics
- `generateTrafficVolumeBuckets()`: Creates dynamic time-bucketed traffic data

Pure functions that are easy to test and reason about.

## Build & Development

### Build

```bash
pnpm --filter dashboard build
```

Produces optimized production bundle in `dist/`.

### Development

```bash
pnpm --filter dashboard dev
```

Starts Vite dev server with hot module replacement.

## Dependencies

### Core
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite 6**: Build tool

### Visualization
- **rrweb/rrweb-player**: Session replay
- **lucide-react**: Icon library

### Styling
- **Tailwind CSS v4**: Utility-first CSS
- **@fontsource/inter & jetbrains-mono**: Local fonts

### Quality
- **Markdown**: Component documentation via JSDoc

## Professional Standards

✅ **Code Quality**
- JSDoc comments on all components and functions
- Clear prop interfaces with documentation
- Consistent naming conventions
- Single responsibility principle

✅ **Maintainability**
- Separation of concerns (components, hooks, services, utils)
- Constants extracted to avoid magic numbers
- Reusable sub-components
- Type-safe throughout

✅ **Scalability**
- Modular folder structure
- Easy to add new panels or features
- Performance-optimized (memoization, lazy loading)
- Pagination support for large datasets

✅ **Accessibility**
- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard-accessible interactions

## Future Enhancements

- [ ] Dark/light theme toggle
- [ ] Custom dashboard layout
- [ ] Export session data (JSON, CSV)
- [ ] Advanced filtering and search
- [ ] Session tagging and organization
- [ ] Real-time notifications
- [ ] Custom dashboard widgets

## Contributing

When adding new features:

1. **Create a new component** in the appropriate folder
2. **Define prop interfaces** with JSDoc comments
3. **Extract logic** to utilities or custom hooks
4. **Add constants** to `constants/index.ts`
5. **Maintain consistent styling** with existing code

## License

[Project License]
