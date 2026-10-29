# PostMAKER 0.2 draft

This branch adds the installable PostMAKER PWA on top of the editor MVP and public WebMAKER club-data adapter. The web client supports Manual mode, validated public JSON import, a club Brand Kit, multiple graphics, versioned template layers, shared matches, local autosave, recoverable project backup and PNG sharing/download. The build targets `https://playmaker-apps.github.io/postmaker/`; this branch does not deploy it. The desktop app remains future work.

The PWA uses the supplied PostMAKER logo, a relative manifest, a versioned app-shell cache, an explicit update action, IndexedDB quota guidance and responsive collapsible panels. Playwright verifies save/reload, backup recovery, PNG output, Pages paths and offline restart. Physical iPhone and visual fidelity checks remain release gates and are documented separately.

The public club contract is owned by `playmaker-schema` as `club-public-0.1`; WebMAKER exports selected publishable fields without changing TagMAKER's JSON or the existing site CSV/YAML formats. This release is a web app and installable PWA, not an App Store or native mobile app.
