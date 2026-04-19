# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS (calorie-tracker artifact)

## Applications

### CalTrack — Daily Calorie Tracker (`artifacts/calorie-tracker`)
Full-stack calorie tracking app at `/`.

**Features:**
- Log daily food intake (breakfast, lunch, dinner, snacks)
- Log calories burned (walking, workout, other)
- Net calorie calculation with deficit/surplus/maintenance status
- User profile with TDEE calculation (Mifflin-St Jeor formula)
- Goal setting (lose/maintain/gain weight) with target calorie delta
- Today's recommendation system ("You can eat X more kcal today")
- Weight change estimation (7700 kcal = 1 kg)
- Statistics dashboard with Recharts charts (intake vs burned, net calories trend, weight trend)
- Daily history with CSV export
- Dark mode support (next-themes)
- Edit past entries

**Pages:**
- `/` — Dashboard with today's overview and recommendation
- `/log/:date` — Log/edit entry for a specific date
- `/history` — Entry history with CSV export
- `/stats` — Statistics charts (30-day trends)
- `/profile` — User profile & goals settings

### API Server (`artifacts/api-server`)
Express 5 REST API at `/api`.

**Routes:**
- `GET/PUT /api/profile` — User profile CRUD
- `GET/POST /api/entries` — List/create entries
- `GET /api/entries/today` — Today's entry
- `GET/PUT/DELETE /api/entries/:date` — Entry by date
- `GET /api/stats/summary` — Weekly/monthly stats summary
- `GET /api/stats/weekly` — Last 7 days data
- `GET /api/stats/monthly` — Last 30 days data
- `GET /api/stats/weight-trend` — Estimated weight trend
- `GET /api/stats/today-recommendation` — Today's recommendation

## Database Schema

- `profile` — User profile (weight, height, age, gender, activity_level, goal, target_calorie_delta, tdee)
- `entries` — Daily entries (date unique key, meal kcal fields, activity kcal fields, notes)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
