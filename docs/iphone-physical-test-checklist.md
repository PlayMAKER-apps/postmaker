# Physical iPhone test checklist

This checklist requires a real iPhone and must be completed by the user or release tester. Automated Chromium checks do not prove Safari, Home Screen, Photos or Share Sheet behavior.

- [ ] Open the production HTTPS URL in Safari and confirm the supplied PostMAKER logo and purple browser theme appear.
- [ ] Follow **Share → Add to Home Screen → Open as Web App → Add**; record the iOS version and any different wording.
- [ ] Launch from the Home Screen and confirm standalone display, icon, safe-area padding and rotation behavior.
- [ ] Create a project, edit its name, close the PWA, reopen it and confirm the project is restored.
- [ ] Select a photo from Photos and another image from Files; deny permission once and confirm the app remains usable.
- [ ] Export a PNG and confirm the Share Sheet can save it to Photos or Files.
- [ ] Export a project JSON backup, delete the local project and import the backup successfully.
- [ ] After a complete online load, enable Airplane Mode, relaunch the PWA and confirm the editor opens with the saved project.
- [ ] Confirm the app explains that a first offline launch is unsupported and that browser storage is not permanent.
- [ ] Fill browser storage or use a low-storage device if practical; confirm a clear quota error and backup guidance.
- [ ] Test VoiceOver focus order, 200% text size, touch targets and panel expansion.
- [ ] Install a newer build, relaunch online and confirm the update prompt applies the new version without losing the local project.

Record failures with the iPhone model, iOS version, installed/browser mode, reproduction steps and a screenshot or screen recording when possible.
