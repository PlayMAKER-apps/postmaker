# PostMAKER Desktop

PostMAKER Desktop is a Tauri 2 shell around the same React application used by `apps/web`. There is no second editor implementation: templates, Canvas rendering, Brand Kit, WebMAKER import and project validation come from the shared packages and frontend.

Run `npm run desktop:dev` for development or `npm run desktop:build -- --no-bundle` for a local executable build. Installer packaging is reserved for the manually authorized CI workflow. See `docs/install-windows.md` and `docs/windows-clean-machine-checklist.md`.
