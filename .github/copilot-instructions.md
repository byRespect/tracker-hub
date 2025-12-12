# Tracker Hub - Copilot Instructions

## About the Project

Tracker Hub is a telemetry platform that records and analyzes user sessions.

## Monorepo Structure

- `packages/core` - TypeScript tracker library
- `packages/frontend` - React demo application
- `packages/backend` - NestJS API server
- `packages/dashboard` - React admin panel

## Technologies

- **Package Manager**: pnpm (workspace)
- **Build**: TypeScript, Vite
- **Frontend**: React 19, Tailwind CSS v4
- **Backend**: NestJS, MongoDB
- **Session Replay**: rrweb

## Development Commands

```bash
# Build all packages
pnpm build

# Dashboard development
pnpm --filter dashboard dev

# Start backend
pnpm --filter backend start:dev
```

## Code Standards

- TypeScript strict mode
- Use React.FC<Props> pattern for components
- API calls from api/ directory
- State management from store/ directory

## Dashboard Architecture

```
dashboard/src/
 api/        # HTTP client, endpoints
 components/ # React components
 config/     # Application settings
 hooks/      # Custom hooks
 store/      # Context + Reducer
 types/      # TypeScript types
 utils/      # Utility functions
```

## Guidelines

- Do not modify classnames or styles (Tailwind classes)
- Add type definitions under types/ when creating new components
- Add endpoints to api/sessions.ts when adding API calls
- Export hooks from hooks/index.ts
