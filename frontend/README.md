# OpenSpectrum Frontend

React + Vite + TypeScript PWA

## Status

**Not yet scaffolded.** This directory is a placeholder.

## Planned Setup

```bash
npm create vite@latest . -- --template react-ts
npm install
npm run dev
```

## Key Dependencies (planned)

- `react-router-dom` — routing
- `recharts` — charts and visualizations
- `react-query` (TanStack Query) — API data fetching and caching

## Getting Started

Use Docker Compose from the repo root for the full dev stack:

```bash
docker-compose up
```

See the [main README](../README.md) and [CONTRIBUTING.md](../CONTRIBUTING.md) for full setup instructions.

## PWA Notes

The app will be configured as a Progressive Web App to support:
- Offline access to cached data
- "Add to home screen" on mobile
- Service worker for background sync (future)

---

*Architecture decisions are documented in [openspectrum-docs](https://github.com/OpenSpectrum/openspectrum-docs).*
