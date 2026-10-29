# Clean Windows machine release checklist

These checks require a separate clean Windows 10/11 machine or VM. They are release requirements and have not been completed by the automated development environment.

- [ ] Record Windows edition, version, architecture and WebView2 version.
- [ ] Install the unsigned NSIS or MSI package as a standard user and record every Windows warning.
- [ ] Confirm the Start menu entry, supplied PostMAKER icon, launch, resize and uninstall behavior.
- [ ] Disconnect the network and create a project, import public WebMAKER JSON and export post, story and square PNG files.
- [ ] Open the same JSON and ZIP project backups in the PWA and desktop app; compare dimensions and content.
- [ ] Compare exported pixels. Exact output is expected for bundled images and geometry; system font rasterization may vary by WebView2, Windows scaling and font availability. Record any differing pixels and confirm that layout bounds, text content, colors and output dimensions match.
- [ ] Test 100%, 125%, 150% and 200% Windows display scaling and both a standard and high-DPI monitor.
- [ ] Save into Documents, Desktop and a user-created folder. Confirm no file changes occur before a dialog selection.
- [ ] Cancel every open/save dialog and confirm no project data is lost or file is created.
- [ ] Try a read-only directory and confirm a clear error without overwriting another file.
- [ ] Sign out or switch Windows user. Confirm projects and recent paths are not shared unintentionally between user profiles.
- [ ] Import malformed JSON/ZIP and confirm the same validation errors as the PWA.
- [ ] Run Windows Defender or the organization's malware scanner against the installer and installed files.
- [ ] Verify uninstall removes application binaries and document any user data that remains in the Windows profile.

Attach screenshots, exported fixtures, hashes and reproduction details to the release approval. Do not mark this checklist complete from CI results alone.
