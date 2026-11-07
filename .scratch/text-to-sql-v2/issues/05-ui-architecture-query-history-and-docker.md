# 05: UI Architecture, Query History, and Docker

**What to build:** Complete frontend modularization with robust state management, persistent local query history, and production-grade Docker containerization for one-command deployment.

**Blocked by:** 04: Hybrid Analysis and Visualizations

**Status:** ready-for-agent

- [ ] Monolithic `App.tsx` decomposed into dedicated, cohesive components (`QueryInput`, `ResultTable`, `ChartView`, `SchemaExplorer`, `QueryHistory`, `SqlPreview`, `ExampleQueries`).
- [ ] TanStack React Query (`@tanstack/react-query`) integrated for streamlined query lifecycle, loading skeletons, caching, and retry handling.
- [ ] `QueryHistory` component implemented using browser `localStorage` to preserve the last 50 queries with timestamps and one-click rerun.
- [ ] Backend containerized using `python:3.11-slim` with Uvicorn.
- [ ] Frontend containerized using a multi-stage Docker build (Node.js build stage served via high-performance Nginx).
- [ ] Root `docker-compose.yml` configures both services with shared environment variables and read-only database volume mounts.
- [ ] `.env.example` templates created for both backend and frontend, and `.gitignore` updated to prevent credential leaks.
- [ ] Project builds and runs cleanly via `docker compose up` with end-to-end verification.

