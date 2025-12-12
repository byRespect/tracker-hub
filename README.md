<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS">
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker">
</p>

<h1 align="center">🔍 Tracker Hub</h1>

<p align="center">
  <strong>A powerful telemetry platform for recording and analyzing user sessions</strong>
</p>

<p align="center">
  <a href="https://github.com/byRespect/tracker-hub/actions/workflows/ci.yml">
    <img src="https://github.com/byRespect/tracker-hub/actions/workflows/ci.yml/badge.svg" alt="CI">
  </a>
  <a href="https://github.com/byRespect/tracker-hub/actions/workflows/codeql.yml">
    <img src="https://github.com/byRespect/tracker-hub/actions/workflows/codeql.yml/badge.svg" alt="CodeQL">
  </a>
  <a href="https://github.com/byRespect/tracker-hub/releases">
    <img src="https://img.shields.io/github/v/release/byRespect/tracker-hub?include_prereleases" alt="Release">
  </a>
  <a href="https://github.com/byRespect/tracker-hub/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/byRespect/tracker-hub" alt="License">
  </a>
  <a href="https://github.com/byRespect/tracker-hub/stargazers">
    <img src="https://img.shields.io/github/stars/byRespect/tracker-hub" alt="Stars">
  </a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-docker">Docker</a> •
  <a href="#-usage">Usage</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

##  Features

###  Core Tracker
- **Session Recording** - Capture DOM changes with rrweb
- **Console Logging** - Intercept all console output
- **Network Monitoring** - Track HTTP requests
- **Error Tracking** - Automatic JavaScript error capture

###  Dashboard
- **Session Replay** - Watch user sessions like a video
- **Real-time Analytics** - Live metrics and statistics
- **Network Inspector** - Detailed HTTP request analysis
- **Console Viewer** - Filter and search log entries
- **API Simulator** - Request testing tool

###  Backend
- **RESTful API** - Robust API with NestJS
- **MongoDB Storage** - Flexible data storage
- **Pagination** - Handle large datasets efficiently
- **Global Stats** - Statistics across all sessions

---

##  Demo

<p align="center">
  <img src="docs/screenshots/dashboard.gif" alt="Dashboard Preview" width="100%">
</p>

---

##  Installation

### Requirements

- **Node.js** >= 18.x
- **pnpm** >= 8.x
- **MongoDB** >= 6.x
- **Docker** >= 20.x (optional, for containerized deployment)

### Steps

```bash
# Clone the repository
git clone https://github.com/byRespect/tracker-hub.git
cd tracker-hub

# Install dependencies
pnpm install

# Create environment file
cp .env.example .env

# Build all packages
pnpm build
```

---

## 🐳 Docker

### Quick Start with Docker Compose

The easiest way to run the entire stack:

```bash
# Clone the repository
git clone https://github.com/byRespect/tracker-hub.git
cd tracker-hub

# Start all services
docker compose up -d

# Check status
docker compose ps
```

### Services

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:1337 | NestJS REST API |
| **Frontend** | http://localhost:3000 | React demo application |
| **Dashboard** | http://localhost:3001 | Admin panel |
| **MongoDB** | localhost:27018 | Database (internal: 27017) |

### Docker Commands

```bash
# Start all services in background
docker compose up -d

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend

# Stop all services
docker compose down

# Rebuild images (after code changes)
docker compose build --no-cache
docker compose up -d

# Remove all data (including volumes)
docker compose down -v
```

### Build Individual Images

```bash
# Build only backend
docker compose build backend

# Build only frontend
docker compose build frontend

# Build only dashboard
docker compose build dashboard
```

### Health Checks

```bash
# Check backend health
curl http://localhost:1337/health

# Check frontend
curl http://localhost:3000/health

# Check dashboard
curl http://localhost:3001/health
```

---

##  Usage

### Development

```bash
# Start the backend
pnpm --filter backend start:dev

# Start the dashboard
pnpm --filter dashboard dev

# Start the frontend demo
pnpm --filter frontend dev
```

### Production

```bash
# Build all packages
pnpm build

# Start backend in production mode
pnpm --filter backend start:prod
```

### Tracker Integration

```typescript
import { TrackerBuilder } from '@tracker-hub/core';

const tracker = new TrackerBuilder()
  .withSession({ userId: 'user-123', name: 'Session Name' })
  .withConsoleLogger()
  .withNetworkLogger()
  .withRrwebRecorder()
  .build();

// Start tracking
tracker.start();

// Optional: Stop tracking
tracker.stop();
```

---

##  Architecture

```
tracker-hub/
 packages/
    core/           # TypeScript tracker library
       src/
          core/       # Session management
          logger/     # Console, Network, DOM loggers
          shared/     # Common types and utilities
       package.json
   
    dashboard/      # React admin panel
       src/
          api/        # HTTP client and endpoints
          components/ # React components
          hooks/      # Custom hooks
          store/      # Context + Reducer state
          types/      # TypeScript types
       package.json
   
    backend/        # NestJS API server
       src/
          config/     # Application configuration
          sessions/   # Session CRUD operations
          infrastructure/
       package.json
   
    frontend/       # React demo application
        src/

 pnpm-workspace.yaml
 package.json
```

### Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Vite |
| **Backend** | NestJS, Fastify, MongoDB, Mongoose |
| **Tracker** | rrweb, TypeScript |
| **Build** | pnpm workspaces, tsup |

---

##  Configuration

### Environment Variables

```env
# Backend
PORT=1337
HOST=0.0.0.0

# MongoDB Connection
# For MongoDB with authentication:
MONGO_URI=mongodb://trackr:trackr@localhost:27017/trackrdb?authSource=admin
# For MongoDB without authentication:
# MONGO_URI=mongodb://localhost:27017/trackrdb

CORS_ORIGIN=http://localhost:5173

# Dashboard
VITE_API_URL=http://localhost:1337
```

### MongoDB Setup

**Option 1: Using Docker Compose (Recommended)**

```bash
# Starts MongoDB with authentication automatically
docker compose up -d mongodb
```

**Option 2: Standalone MongoDB Container**

```bash
# MongoDB with Docker (with authentication)
docker run -d --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=trackr \
  -e MONGO_INITDB_ROOT_PASSWORD=trackr \
  -e MONGO_INITDB_DATABASE=trackrdb \
  -p 27017:27017 \
  mongo:7

# or without authentication
docker run -d --name mongodb -p 27017:27017 mongo:7
```

---

##  API Reference

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sessions` | List all sessions |
| `GET` | `/sessions/:id` | Get session details |
| `GET` | `/sessions/stats` | Get global statistics |
| `POST` | `/sessions` | Create new session |
| `PATCH` | `/sessions/:id` | Update session |
| `DELETE` | `/sessions/:id` | Delete session |

---

##  Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

##  License

This project is licensed under the [MIT License](LICENSE).

---

##  Acknowledgments

- [rrweb](https://github.com/rrweb-io/rrweb) - Session replay technology
- [NestJS](https://nestjs.com/) - Backend framework
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

<p align="center">
  Made with  in Turkey
</p>
