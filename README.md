# PostMAKER

PostMAKER is the PlayMAKER product for creating sports social graphics. This repository is an independent bootstrap based on a functional audit of the Nerone graphic generator. Its code is newly written around neutral match data and synthetic fixtures. No Nerone site code or club media is copied into this repository.

## Current state

- `packages/editor-core`: browser Canvas 2D renderer for calendar, week, matchday and result compositions, image positioning, layered glass panels and PNG export.
- `packages/data-connectors`: a match source interface, generic game mapping and CSV import.
- `packages/ui`: small reusable React controls.
- `apps/web`: an early editor prototype with live preview, local background upload, CSV import and PNG download. The full web application is still to be built.
- `apps/desktop`: reserved for a future desktop application; no desktop app is available yet.

The prototype uses synthetic teams. The PostMAKER logo in `apps/web/public/postmaker.png` comes from the PlayMAKER workspace, supplied for this project.

## Develop

Requires Node.js 22 or later.

```sh
npm install
npm run typecheck
npm test
npm run build
npm run dev --workspace @postmaker/web
```

Open the local URL printed by Vite. No deployment is configured.

## Import format

CSV columns: `home_team,away_team,date` are required. Optional columns are `id,time,competition,venue,address,home_score,away_score`. Team names can be edited in the prototype; an external system can implement `MatchSource` and map its records through `mapGames`. See `examples/synthetic-matches.csv`.

See [extraction audit](docs/extraction-audit.md) and [migration checklist](docs/migration-checklist.md) for origin, exclusions and remaining work.
