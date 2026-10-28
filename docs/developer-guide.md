# PostMAKER developer guide

`apps/web` is a React/Vite client. `packages/editor-core` owns the versioned `TemplateConfig` and the Canvas renderer. `packages/data-connectors` validates WebMAKER public club 0.1 data before mapping it to the shared `Match` model. `packages/ui` contains small controls. The desktop folder is reserved. No AI service or account is required.

Project JSON has `schemaVersion: 1`, a Brand Kit, a canonical project-level match list, graphics and an optional cached public source snapshot. Template layers have `version: 1` and normalized 1080 × 1350 coordinates, scaled vertically for story and square output. New schema versions must add an explicit parser/migration; do not reinterpret existing fields. Imported file paths are rejected unless images are HTTPS URLs or embedded image data URLs.

`storage.ts` saves the whole project to IndexedDB, reports quota errors, exposes a storage estimate and supports explicit project/data deletion. The UI can request persistent browser storage, but it never promises indefinite retention. JSON export is the recovery path.

The Vite build uses `/postmaker/` as its GitHub Pages base. `scripts/finalize-pwa.mjs` creates a versioned service worker from the built app shell. Only known build files are precached; uploaded images, project JSON, remote club data and arbitrary same-origin responses are not placed in Cache Storage. Project data stays in IndexedDB. Navigation uses the network first and falls back to the cached root document after the first successful online load. A waiting service worker is applied only when the user chooses the update action.

The HTTPS connector uses an eight-second timeout, omits credentials, and reports CORS/network errors. It never stores a personal access token or writes another repository.

Run `npm ci`, `npm run lint`, `npm test`, `npm run build`, `npx playwright install chromium` and `npm run test:e2e`. Unit tests cover model round trips, all four render categories with synthetic data, version rejection, CSV parsing and WebMAKER public fixture import. Playwright covers IndexedDB reload, recoverable backup import, PNG download, the `/postmaker/` asset path and an offline reload from the service-worker cache. These checks do not prove visual fidelity or physical iPhone behavior; use the separate physical-device checklist. The fixture under `examples/` comes from WebMAKER's synthetic site data and is validated by the shared contract.

The application remains a web app/PWA. No App Store package, Tauri Mobile, Capacitor, account, backend, AI service or direct social publishing is part of this release. The future desktop application should import the same editor components instead of forking their behavior.
