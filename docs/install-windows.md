# Install and use PostMAKER Desktop on Windows

PostMAKER Desktop 0.3 is a Tauri 2 Windows application around the same React/TypeScript editor used by the PWA. It works without an account, GitHub login or internet connection for project editing, local WebMAKER JSON import, backups and PNG export.

## Build for development

Install Node.js 22+, Rust stable with the MSVC target, Microsoft C++ Build Tools and WebView2. Then run:

```powershell
npm ci
npm run desktop:dev
```

For a compiled executable without creating an installer:

```powershell
npm run desktop:build -- --no-bundle
```

The executable is created under `apps/desktop/src-tauri/target/release/`. Installer packaging is available only in the manually started CI packaging job. A public release requires human approval.

## Work with files

- **Open JSON or ZIP project** reads only the file selected in the Windows dialog.
- **Save** writes to the displayed project path. The first save asks for a location.
- **Save as** always asks for a new location.
- **Backup JSON** and **Backup ZIP** create recoverable copies at a location you choose.
- **Export PNG file** asks where to write the rendered image.
- **Import WebMAKER JSON** reads a selected public `club-public-0.1` file through the same validator used by the PWA.

The local project list is an IndexedDB convenience cache. It does not replace an explicit project file or backup. PostMAKER does not scan directories and does not write outside paths selected by the user.

## Versioning and updates

The desktop package version is recorded in `tauri.conf.json` and `Cargo.toml`. Increment both together for a release. Automatic updates are deliberately disabled because no verified update server, signed manifest or signing key has been configured. Download and install an approved newer package manually.

Windows may show an unrecognized publisher warning because this project does not currently provide an Authenticode certificate. Do not describe the installer as digitally signed until a verified signing process exists.

## Web app, PWA and desktop app

The web app runs in a browser tab. The installed PWA runs in a browser-managed standalone window. PostMAKER Desktop is a Windows Tauri package with native file dialogs and explicit filesystem access. All three use the same editor and project schema; this is not a native mobile app.
