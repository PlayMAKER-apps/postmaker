# PostMAKER 0.3.0

PostMAKER 0.3.0 introduces the Windows desktop application alongside the existing offline-first PWA. Both applications use the same React/TypeScript editor, project schema, templates, WebMAKER public-data adapter and Canvas rendering core.

## Highlights

- Native Windows file dialogs for project, image and public WebMAKER data files.
- Explicit JSON project save and save-as workflows.
- Portable JSON and ZIP project backups.
- PNG export for post, story and square formats.
- Shared Brand Kit, presets, templates and GLASS layers.
- No account, GitHub access or internet connection required for core desktop editing.

## Downloads

- `PostMAKER_0.3.0_x64-setup.exe`: recommended current-user Windows installer.
- `PostMAKER_0.3.0_x64_en-US.msi`: alternative Windows Installer package.
- `SHA256SUMS.txt`: SHA-256 checksums generated from the published binaries.

## Important Windows notice

These installers are **unsigned**. Windows may display an **Unknown publisher** warning. Organizations should follow their own software and security policies. PostMAKER does not currently provide automatic desktop updates; install future approved versions manually.

The release workflow runs TypeScript checks, unit tests, dependency audit, the production Tauri build and installer generation from the tagged commit. A separate clean Windows 10/11 acceptance pass should still be repeated and recorded before broad organizational rollout, including offline operation, DPI scaling, install/uninstall behaviour and PWA/desktop project compatibility.

## Web application

The installable PWA remains available at https://playmaker-apps.github.io/postmaker/.
