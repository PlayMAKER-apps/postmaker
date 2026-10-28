# PostMAKER

PostMAKER is the PlayMAKER product for creating sports social graphics. This repository is an independent bootstrap based on a functional audit of the Nerone graphic generator. Its code is newly written around neutral match data and synthetic fixtures. No Nerone site code or club media is copied into this repository.

## Current state

- `packages/editor-core`: versioned template layers and a browser Canvas 2D renderer for Calendar, Week, Matchday and Result, image positioning, layered glass panels and PNG export.
- `packages/data-connectors`: generic CSV import plus a validator and mapper for the separate PlayMAKER public club 0.1 JSON contract.
- `packages/ui`: small reusable React controls.
- `apps/web`: an offline-capable MVP editor with multiple local projects, Brand Kit, live preview, manual match data, WebMAKER public data import, JSON backup and PNG download. It is still an MVP, with browser integration and visual regression testing to complete.
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

Open the local URL printed by Vite. No deployment is configured. See the [user guide](docs/user-guide.md) and [developer guide](docs/developer-guide.md).

## Import format

CSV columns: `home_team,away_team,date` are required. Optional columns are `id,time,competition,venue,address,home_score,away_score`. Team names can be edited in the prototype; an external system can implement `MatchSource` and map its records through `mapGames`. See `examples/synthetic-matches.csv`.

WebMAKER can export the separate [`club-public-0.1` contract](https://github.com/PlayMAKER-apps/playmaker-schema/blob/main/club-public-0.1.schema.json). PostMAKER validates a selected file or HTTPS URL before applying it and stores the imported snapshot in the local project for offline use. See `examples/webmaker-public-club-0.1.json`.

See [extraction audit](docs/extraction-audit.md) and [migration checklist](docs/migration-checklist.md) for origin, exclusions and remaining work.
