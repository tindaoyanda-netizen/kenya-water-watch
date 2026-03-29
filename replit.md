# AquaGuard Kenya

A real-time environmental monitoring and water management platform for Kenya's 47 counties. Residents can track water availability, forecast weather, predict floods, and report environmental issues. County administrators can manage reports and monitor local water stress.

## Architecture

- **Frontend**: Pure Vite + React 18 SPA (TypeScript, Tailwind CSS, shadcn/ui)
- **Backend/Auth/DB**: Supabase (hosted PostgreSQL, Auth, Realtime, Edge Functions)
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router DOM v6
- **Maps**: D3-delaunay (Voronoi county map), custom SVG Kenya map
- **Charts**: Recharts
- **PWA**: vite-plugin-pwa (offline support)

## Running the App

```bash
npm run dev      # Development server (port 5000)
npm run build    # Production build
npm run preview  # Preview production build
```

## Environment Variables

Set in Replit's Secrets/Environment tab:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID` — Supabase project ID

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

## Supabase Edge Functions

The AI-powered features (report analysis, flood prediction, water stress index, daily summaries, email notifications) run as Supabase Edge Functions in Deno. They use the Lovable AI gateway (Gemini models) for analysis.

## Notes

- The `lovable-tagger` devDependency has been removed (Lovable-specific tooling, not needed on Replit)
- Vite dev server is configured for port 5000 with `allowedHosts: true` for Replit compatibility
