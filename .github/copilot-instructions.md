# Project Lead Time Visualizer - AI Coding Agent Instructions

This is a full-stack TypeScript application for visualizing project lead times by integrating data from Confluence, GitHub, and Jira. The system tracks events within projects to analyze development lifecycle timing.

## Architecture Overview

**Frontend**: React + Vite + TailwindCSS + shadcn/ui components
**Backend**: Express.js + MongoDB (Mongoose) + TypeScript
**External Integrations**: Jira, GitHub, Confluence APIs with cron-based sync

The application follows a hierarchical data model: `Organization` → `Workspace` → `Project` → `Event`, where Events are the core entities for lead time calculation.

## Core Domain Models

- **Event**: Central entity with `type: 'duration' | 'one-time'`, `status: 'done' | 'ongoing' | 'notyet'`, and reference links to external sources
- **Project**: Contains events, participants, and cost tracking (`budget`, `estimatedCost`, `actualCost`)
- **ExternalSourceConfig**: Manages API integrations with `projectMappings` for syncing external data

Key pattern: Events drive all calculations - lead times, costs, and project progress tracking.

## Development Workflow

**Backend Development:**
```bash
cd backend
npm run dev          # nodemon with TypeScript
npm test            # Jest with ts-jest
npm run build       # TypeScript compilation
```

**Frontend Development:**
```bash
cd frontend
npm run dev         # Vite dev server
npm run dual        # Concurrent frontend + backend (port 5000)
npm test           # Jest with React Testing Library
```

**Database**: MongoDB connection via `MONGODB_URI` env var, defaults to `mongodb://localhost:27017/project-lead-time-visualizer`

## Key Conventions

1. **API Structure**: RESTful with resource-based routes (`/api/workspaces`, `/api/projects`, `/api/events`)
2. **Type Safety**: Shared types between frontend (`frontend/src/types/`) and backend (`backend/src/types/`)
3. **Error Handling**: Centralized middleware in `backend/src/middleware/errorHandler.ts`
4. **Component Pattern**: shadcn/ui components with custom dialogs in `components/dialogs/`
5. **State Management**: React hooks pattern with custom hooks in `hooks/`

## External Integration Pattern

The `ExternalSourceService` uses:
- Cron jobs for automatic syncing (`node-cron`)
- Source-specific sync methods (`syncJira`, `syncGitHub`, `syncConfluence`)
- Project mappings to link external IDs with internal project IDs

When adding new integrations, follow the pattern in `ExternalSourceService.syncSource()` with type-specific handlers.

## Cost Calculation Logic

Located in `frontend/src/utils/costUtils.ts`:
- Calculates hourly rates from user `dailyFee` (8-hour workday assumption)
- Event costs based on `actualHours` × participant hourly rates
- Project costs aggregate all event costs

## Testing Patterns

- Backend: Jest + supertest for API endpoints, MongoDB test database cleanup between tests
- Frontend: Jest + React Testing Library, setupTests.js for global test configuration
- Test files co-located with source code using `.test.ts/.test.js` pattern

## UI Component Architecture

- Uses shadcn/ui with "new-york" style preset
- TailwindCSS with custom configuration in `frontend/tailwind.config.js`
- Dialog management through custom `useDialog` hook
- Form data handling via `useFormData` hook

## Important File Paths

- Models: `backend/src/models/` (all exports through index.ts)
- Routes: `backend/src/routes/` (mounted under `/api`)
- API client: `frontend/src/services/api.ts` (axios-based with typed endpoints)
- Components: `frontend/src/components/` (dialogs for CRUD operations)
- Utils: Date operations in `dateUtils.ts`, cost calculations in `costUtils.ts`