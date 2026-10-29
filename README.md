# PostMAKER

PostMAKER is the PlayMAKER product for creating sports social graphics. This repository is an independent bootstrap based on a functional audit of the Nerone graphic generator. Its code is newly written around neutral match data and synthetic fixtures. No Nerone site code or club media is copied into this repository.

## Current state

- `packages/editor-core`: versioned template layers and a browser Canvas 2D renderer for Calendar, Week, Matchday and Result, image positioning, layered glass panels and PNG export.
- `packages/data-connectors`: generic CSV import plus a validator and mapper for the separate PlayMAKER public club 0.1 JSON contract.
- `packages/ui`: small reusable React controls.
- `apps/web`: an installable PWA with multiple local projects, Brand Kit, live preview, manual match data, WebMAKER public data import, recoverable JSON backups and PNG sharing/download. It is built for the GitHub Pages `/postmaker/` path and can start offline after its first successful online load.
- `apps/desktop`: a Tauri 2 Windows shell that builds and runs the same `apps/web` React editor, adding native user-selected file dialogs, explicit project files, ZIP backups and PNG export.

The prototype uses synthetic teams. The PostMAKER logo in `apps/web/public/postmaker.png` comes from the PlayMAKER workspace, supplied for this project.

## Develop

Requires Node.js 22 or later.

```sh
npm install
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev --workspace @postmaker/web
npm run desktop:build -- --no-bundle
```

Open the local URL printed by Vite. The workflow verifies pull requests and deploys `dist/web` to GitHub Pages only on a push to `main`; feature branches never deploy. Windows executable builds are verified on pull requests, while unsigned NSIS/MSI artifacts are produced only by a manually started workflow and are never published automatically. See the [user guide](docs/user-guide.md), [PWA installation tutorial](docs/install-iphone.md), [Windows installation guide](docs/install-windows.md), device checklists and [developer guide](docs/developer-guide.md).

The public URL is expected to be `https://playmaker-apps.github.io/postmaker/` after GitHub Pages is enabled for Actions and an authorized merge reaches `main`.

## Import format

CSV columns: `home_team,away_team,date` are required. Optional columns are `id,time,competition,venue,address,home_score,away_score`. Team names can be edited in the prototype; an external system can implement `MatchSource` and map its records through `mapGames`. See `examples/synthetic-matches.csv`.

WebMAKER can export the separate [`club-public-0.1` contract](https://github.com/PlayMAKER-apps/playmaker-schema/blob/main/club-public-0.1.schema.json). PostMAKER validates a selected file or HTTPS URL before applying it and stores the imported snapshot in the local project for offline use. See `examples/webmaker-public-club-0.1.json`.

See [extraction audit](docs/extraction-audit.md) and [migration checklist](docs/migration-checklist.md) for origin, exclusions and remaining work.
