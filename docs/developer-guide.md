# PostMAKER developer guide

`apps/web` is a React/Vite client. `packages/editor-core` owns the versioned `TemplateConfig` and the Canvas renderer. `packages/data-connectors` validates WebMAKER public club 0.1 data before mapping it to the shared `Match` model. `packages/ui` contains small controls. The desktop folder is reserved. No AI service or account is required.

Project JSON has `schemaVersion: 1`, a Brand Kit, a canonical project-level match list, graphics and an optional cached public source snapshot. Template layers have `version: 1` and normalized 1080 × 1350 coordinates, scaled vertically for story and square output. New schema versions must add an explicit parser/migration; do not reinterpret existing fields. Imported file paths are rejected unless images are HTTPS URLs or embedded image data URLs.

`storage.ts` saves the whole project to IndexedDB, and `sw.js` caches same-origin GET requests after a production visit. IndexedDB and service-worker caches can be cleared by the browser; JSON export is the recovery path. The HTTPS connector uses an eight-second timeout, omits credentials, and reports CORS/network errors. It never stores a personal access token or writes another repository.

Run `npm ci`, `npm run typecheck`, `npm test` and `npm run build`. Tests cover model round trips, all four render categories with synthetic data, version rejection, CSV parsing and WebMAKER public fixture import. Browser interaction and pixel snapshots still need a dedicated test harness; the current mock Canvas tests do not prove visual fidelity. The fixture under `examples/` comes from WebMAKER's synthetic site data and is validated by the shared contract.
