# PostMAKER 0.3 Desktop draft

This branch adds a Tauri 2 Windows shell around the existing PostMAKER React editor. It does not introduce a second editor codebase. PWA and desktop share project schema 1, templates, Brand Kit, GLASS layers, Canvas rendering, WebMAKER public-data validation, ZIP/JSON backup parsing and PNG dimensions.

Desktop-specific behavior is limited to native user-selected file dialogs, explicit JSON project save/save-as, JSON and ZIP backup, PNG export and visible paths. Static permissions contain no broad filesystem scope. Core editing requires no GitHub login, account or network connection.

The package version is 0.3.0. Auto-update is disabled. The installer is unsigned unless a future approved signing workflow is configured. Pull requests compile a Windows executable and smoke-launch it in CI; unsigned NSIS/MSI artifacts are created only by manual workflow dispatch and are retained as CI artifacts without publication.

Automated acceptance covers shared backup round trips, configuration reuse, file capability constraints, TypeScript, unit tests, PWA tests, desktop frontend build and Rust/Tauri compilation. A clean-machine checklist remains an explicit release gate. Pixel comparison permits differences caused by system font rasterization and Windows/WebView2 DPI, while geometry, output dimensions, content and colors must match.
