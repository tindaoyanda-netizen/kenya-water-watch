# AquaGuard Kenya

A real-time environmental monitoring and water management platform for Kenya's 47 counties. Residents can track water availability, forecast weather, predict floods, and report environmental issues. County administrators can manage reports and monitor local water stress.

## Architecture

- **Frontend**: Pure Vite + React 18 SPA (TypeScript, Tailwind CSS, shadcn/ui)
- **Backend/Auth/DB**: Supabase (hosted PostgreSQL, Auth, Realtime, Edge Functions)
- **Admin API Server**: Express.js (Node.js, port 3001) — Government Admin operations with service role key
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM v6
- **Maps**: D3-delaunay (Voronoi county map), custom SVG Kenya map
- **Charts**: Recharts
- **PWA**: vite-plugin-pwa (offline support)

## Running the App

Two workflows must be running:
- **Start application** (`npm run dev`) — Vite frontend dev server on port 5000
- **Backend API** (`node server/index.js`) — Express admin API server on port 3001

Vite proxies all `/api/*` requests to the Express server on port 3001.

## Environment Variables

Set in Replit's Secrets/Environment tab:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ID
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (used by Express backend to bypass RLS for government admin actions)

## Key Directories

- `src/pages/` — Route-level page components (Index, Dashboard, Auth, Permissions)
- `src/components/` — UI components (admin, dashboard, reporting, ui)
- `src/hooks/` — Custom hooks (useAuth, useRealtimeReports, useResidentNotifications)
- `src/integrations/supabase/` — Supabase client + TypeScript types
- `src/data/` — Static county data and metrics
- `supabase/functions/` — Edge Functions (analyze-report, predict-flood, water-stress-index, daily-summary, notify-resident, batch-submit)
- `supabase/migrations/` — All database migration SQL files

## User Roles

- **resident** — View data, submit reports, receive notifications
- **county_admin** — Full admin dashboard, manage reports, invite sub-admins
- **sub_admin** — Limited admin capabilities (configurable per invitation)
- **Government Admin** (special) — Single national-level account. Uses `county_admin` role with `county_id = 'kenya_national'`. Signs up via Auth page with a secret authorization code (`KENYA-GOV-2024`). Gets a full-screen National Command Centre dashboard showing all reports from all 47 counties, with verify/reject actions and analytics.

## Government Admin Feature

- **Account uniqueness**: Enforced by checking `/api/admin/check-gov-admin` before signup
- **Authorization code**: `KENYA-GOV-2024` (required on the signup form when "Government Admin" account type is selected)
- **Special county_id**: `kenya_national` (reserved value that distinguishes from normal county admins)
- **Dashboard**: Full-screen overlay with stats, filterable report list, detail panel with verify/reject actions, replies, and an analytics tab with county/type breakdowns
- **Express backend**: `server/index.js` uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS for cross-county verify/reject operations

## Supabase Edge Functions

The AI-powered features (report analysis, flood prediction, water stress index, daily summaries, email notifications) run as Supabase Edge Functions in Deno. They use the Lovable AI gateway (Gemini models) for analysis.

## Notes

- The `lovable-tagger` devDependency has been removed (Lovable-specific tooling, not needed on Replit)
- Vite dev server is configured for port 5000 with `allowedHosts: true` for Replit compatibility
