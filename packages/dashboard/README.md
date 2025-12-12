# Tracker Hub Dashboard

Admin panel for session replay and telemetry monitoring.

## Features

- **Session Replay** - DOM event recording and playback with rrweb
- **Network Monitoring** - HTTP/WebSocket request tracking
- **Console Logs** - Error and log viewer
- **AI Analysis** - Automatic error analysis with Gemini
- **Responsive** - Mobile-friendly interface

## Technologies

- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4
- rrweb-player
- Lucide React Icons

## Installation

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Production build
pnpm build
```

## Environment Variables

Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:1337
GEMINI_API_KEY=your-api-key
```

## Project Structure

```
src/
 api/           # HTTP client and endpoints
 components/    # React components
 config/        # Application configuration
 constants/     # Constant values
 hooks/         # Custom React hooks
 services/      # External services (Gemini)
 store/         # State management (Context)
 types/         # TypeScript type definitions
 utils/         # Utility functions
```

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## License

MIT
