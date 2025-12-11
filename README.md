<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
</p>

<h1 align="center">🔍 Tracker Hub</h1>

<p align="center">
  <strong>Kullanıcı oturumlarını kaydeden ve analiz eden güçlü bir telemetri platformu</strong>
</p>

<p align="center">
  <a href="#-özellikler">Özellikler</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-kurulum">Kurulum</a> •
  <a href="#-kullanım">Kullanım</a> •
  <a href="#-mimari">Mimari</a> •
  <a href="#-katkıda-bulunma">Katkıda Bulunma</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/pnpm-workspace-F69220?logo=pnpm" alt="pnpm workspace">
</p>

---

## ✨ Özellikler

### 🎯 Core Tracker
- **Session Recording** - rrweb ile DOM değişikliklerinin kaydı
- **Console Logging** - Tüm console çıktılarının yakalanması
- **Network Monitoring** - HTTP isteklerinin izlenmesi
- **Error Tracking** - JavaScript hatalarının otomatik yakalanması

### 📊 Dashboard
- **Session Replay** - Kullanıcı oturumlarını video gibi izleme
- **Real-time Analytics** - Canlı metrik ve istatistikler
- **Network Inspector** - HTTP isteklerinin detaylı analizi
- **Console Viewer** - Log kayıtlarının filtrelenmesi ve aranması
- **API Simulator** - Request test aracı

### 🚀 Backend
- **RESTful API** - NestJS ile güçlü API
- **MongoDB Storage** - Esnek veri depolama
- **Pagination** - Büyük veri setleri için sayfalama
- **Global Stats** - Tüm session'lar için istatistikler

---

## 🖼️ Demo

<p align="center">
  <img src="docs/screenshots/dashboard.gif" alt="Dashboard Preview" width="100%">
</p>

---

## 📦 Kurulum

### Gereksinimler

- **Node.js** >= 18.x
- **pnpm** >= 8.x
- **MongoDB** >= 6.x

### Adımlar

```bash
# Repository'yi klonla
git clone https://github.com/byRespect/tracker-hub.git
cd tracker-hub

# Bağımlılıkları yükle
pnpm install

# Environment dosyasını oluştur
cp .env.example .env

# Tüm paketleri derle
pnpm build
```

---

## 🚀 Kullanım

### Development

```bash
# Backend'i başlat
pnpm --filter backend start:dev

# Dashboard'u başlat
pnpm --filter dashboard dev

# Frontend demo'yu başlat
pnpm --filter frontend dev
```

### Production

```bash
# Tüm paketleri derle
pnpm build

# Backend'i production modunda başlat
pnpm --filter backend start:prod
```

### Tracker Entegrasyonu

```typescript
import { TrackerBuilder } from '@tracker-hub/core';

const tracker = new TrackerBuilder()
  .withSession({ userId: 'user-123', name: 'Session Name' })
  .withConsoleLogger()
  .withNetworkLogger()
  .withRrwebRecorder()
  .build();

// Tracking'i başlat
tracker.start();

// İsteğe bağlı: Tracking'i durdur
tracker.stop();
```

---

## 🏗️ Mimari

```
tracker-hub/
├── packages/
│   ├── core/           # TypeScript tracker kütüphanesi
│   │   ├── src/
│   │   │   ├── core/       # Session yönetimi
│   │   │   ├── logger/     # Console, Network, DOM loggers
│   │   │   └── shared/     # Ortak tipler ve yardımcılar
│   │   └── package.json
│   │
│   ├── dashboard/      # React admin paneli
│   │   ├── src/
│   │   │   ├── api/        # HTTP client ve endpoint'ler
│   │   │   ├── components/ # React bileşenleri
│   │   │   ├── hooks/      # Custom hook'lar
│   │   │   ├── store/      # Context + Reducer state
│   │   │   └── types/      # TypeScript tipleri
│   │   └── package.json
│   │
│   ├── backend/        # NestJS API sunucusu
│   │   ├── src/
│   │   │   ├── config/     # Uygulama yapılandırması
│   │   │   ├── sessions/   # Session CRUD işlemleri
│   │   │   └── infrastructure/
│   │   └── package.json
│   │
│   └── frontend/       # React demo uygulaması
│       └── src/
│
├── pnpm-workspace.yaml
└── package.json
```

### Teknoloji Stack

| Katman | Teknolojiler |
|--------|-------------|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Vite |
| **Backend** | NestJS, Fastify, MongoDB, Mongoose |
| **Tracker** | rrweb, TypeScript |
| **Build** | pnpm workspaces, tsup |

---

## 🔧 Yapılandırma

### Environment Variables

```env
# Backend
PORT=1337
HOST=0.0.0.0

# MongoDB Bağlantısı
# Authentication gerektiren MongoDB için:
MONGO_URI=mongodb://trackr:trackr@localhost:27017/trackrdb?authSource=admin
# Authentication gerektirmeyen MongoDB için:
# MONGO_URI=mongodb://localhost:27017/trackrdb

CORS_ORIGIN=http://localhost:5173

# Dashboard
VITE_API_URL=http://localhost:1337
```

### MongoDB Kurulumu

```bash
# Docker ile MongoDB (authentication ile)
docker run -d --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=trackr \
  -e MONGO_INITDB_ROOT_PASSWORD=trackr \
  -e MONGO_INITDB_DATABASE=trackrdb \
  -p 27017:27017 \
  mongo:7

# veya authentication olmadan
docker run -d --name mongodb -p 27017:27017 mongo:7
```

---

## 📝 API Reference

### Sessions

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| `GET` | `/sessions` | Tüm session'ları listele |
| `GET` | `/sessions/:id` | Tek session detayı |
| `GET` | `/sessions/stats` | Global istatistikler |
| `POST` | `/sessions` | Yeni session oluştur |
| `PATCH` | `/sessions/:id` | Session güncelle |
| `DELETE` | `/sessions/:id` | Session sil |

---

## 🤝 Katkıda Bulunma

Katkılarınızı memnuniyetle karşılıyoruz! Lütfen [CONTRIBUTING.md](CONTRIBUTING.md) dosyasını okuyun.

1. Fork'layın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit'leyin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push'layın (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

---

## 🙏 Teşekkürler

- [rrweb](https://github.com/rrweb-io/rrweb) - Session replay teknolojisi
- [NestJS](https://nestjs.com/) - Backend framework
- [React](https://react.dev/) - UI kütüphanesi
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

<p align="center">
  Made with ❤️ in Turkey
</p>
