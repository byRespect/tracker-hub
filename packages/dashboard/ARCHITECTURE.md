# Dashboard Project Architecture

## Overview

The Tracker Hub Dashboard is a React-based admin panel built with TypeScript, providing real-time session monitoring, replay, and analytics capabilities.

## Project Structure

```
packages/dashboard/
 src/
     api/                        # Backend communication
         client.ts              # HTTP client (fetch wrapper)
         sessions.ts            # Session API endpoints
         index.ts               # Public exports
     components/                 # React components
         DashboardPanel/        # Dashboard container
             StatCard.tsx       # Metric cards
             SessionCard.tsx    # Session card
             DeleteConfirmationModal.tsx
             index.ts
         ConsolePanel.tsx       # Console logs viewer
         NetworkPanel.tsx       # Network requests
         SessionPanel.tsx       # rrweb replay
         OverviewPanel.tsx      # Session analytics
         ...
     config/                     # Application configuration
         index.ts               # API URL, pagination settings
     constants/                  # Constant values
         index.ts               # APP_CONFIG, color variants
     hooks/                      # Custom React hooks
         useSessionActions.ts   # Session CRUD operations
         usePagination.ts       # Pagination state management
         index.ts
     services/                   # External services
         geminiService.ts       # AI error analysis
     store/                      # State management
         sessionStore.ts        # Reducer and actions
         SessionContext.tsx     # React Context provider
         index.ts
     types/                      # TypeScript type definitions
         session.ts             # Session, UserInfo
         console.ts             # ConsoleLog, LogLevel
         network.ts             # NetworkLog, NetworkMeta
         dom.ts                 # DOMEvent
         analytics.ts           # SessionAnalytics
         common.ts              # PaginationMeta, ViewMode
         index.ts               # All exports
     utils/                      # Utility functions
         analytics.ts           # Analytics calculations
         formatters.ts          # Date, number formatting
         index.ts
     App.tsx                     # Root component
     index.tsx                   # Entry point
     index.css                   # Global styles (Tailwind)
     global.d.ts                 # TypeScript declarations
 vite.config.ts                 # Vite configuration
 tsconfig.json                  # TypeScript config
 postcss.config.cjs             # PostCSS (Tailwind v4)
 package.json
```

## Core Design Principles

### 1. Modular Structure

- **api/**: All backend communication through a centralized HTTP client
- **store/**: State management with useReducer + Context pattern
- **types/**: Type definitions organized by domain
- **hooks/**: Reusable hooks that consume Context

### 2. Separation of Concerns

- **Components**: UI rendering only
- **Hooks**: State and side effect management
- **Store**: Global state (sessions, pagination)
- **API**: Network requests
- **Utils**: Pure computation functions

### 3. Type Safety

- All components defined with `React.FC<Props>`
- Domain-based type files (session.ts, network.ts, ...)
- Strict TypeScript configuration

## Component Details

### DashboardPanel

**Purpose**: Main dashboard view showing session list and metrics.

**Sub-components**:
- `StatCard`: Metric cards (requests, logs, errors)
- `SimpleSparkline`: Traffic volume chart
- `SessionCard`: Session cards in grid
- `DeleteConfirmationModal`: Delete confirmation dialog

### SessionContext

**Purpose**: Global session state management.

**Provided Values**:
- `state`: Sessions, activeSessionId, loading, error, pagination
- `fetchSessions`: Load session list
- `createSession`: Create new session
- `switchSession`: Load session details
- `deleteSession`: Delete session
- `currentSession`: Active session object

### ConsolePanel

**Purpose**: Console log viewer and AI error analysis.

**Features**:
- Expandable log entries
- Error/warning filtering
- Pagination support
- AI-powered error analysis (via Gemini)

### NetworkPanel

**Purpose**: Network request monitoring.

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

**Note**: All class names and styling remain unchanged for design consistency.

## Data Flow

```
App.tsx (Root)
   DashboardPanel (Sessions List)
       StatCard (Metrics)
       SimpleSparkline (Chart)
       SessionCard (Individual Sessions)
  
   SessionPanel (Session Detail)
       Timeline (DOM Events)
       ConsolePanel (Logs)
       NetworkPanel (Requests)
       OverviewPanel (Analytics)
```

## Configuration and Constants

### App Config (constants/index.ts)

```typescript
export const APP_CONFIG = {
  VERSION: __APP_VERSION__,
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

### Analytics (utils/analytics.ts)

- `generateSessionAnalytics()`: Converts raw session data to aggregated analytics
- `generateTrafficVolumeBuckets()`: Creates dynamic time-bucketed traffic data

Pure functions that are easy to test and reason about.

## Build and Development

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
- **@fontsource/inter and jetbrains-mono**: Local fonts

## Professional Standards

**Code Quality**
- JSDoc comments on all components and functions
- Clear prop interfaces with documentation
- Consistent naming conventions
- Single responsibility principle

**Maintainability**
- Separation of concerns (components, hooks, services, utils)
- Constants extracted to avoid magic numbers
- Reusable sub-components
- Type-safe throughout

**Scalability**
- Modular folder structure
- Easy to add new panels or features
- Performance-optimized (memoization, lazy loading)
- Pagination support for large datasets

**Accessibility**
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

MIT
