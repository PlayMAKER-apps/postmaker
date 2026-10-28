# PostMAKER user guide

## Start and save

Choose **Manual mode** to start with an empty project, or **Import from WebMAKER** to start with a public club data file. The WebMAKER import accepts a local JSON file or a public HTTPS URL following `club-public-0.1`. It previews the club name, available fields and fixture counts before import. URL access needs CORS permission from the club site; PostMAKER has no proxy or GitHub login.

Projects save automatically in this browser's IndexedDB. The save indicator shows progress. Browser storage can be cleared, so use **Export backup JSON** regularly. Reimport the backup from the start screen. Images are embedded in the backup as data URLs; a large image can make the file large. Imported public data is cached in the project, with its export timestamp shown. **Refresh** fetches a new URL snapshot for review; **Disconnect source** removes the link while keeping editable matches.

## Create graphics

Create or duplicate a graphic inside a project. Choose Calendar, Week, Matchday or Result and a 1080 × 1350, 1080 × 1920 or 1080 × 1080 output. Add matches manually or import CSV. A match belongs to the project and is available in every graphic. Missing results remain blank until entered. Choose a match for a graphic or a separate match for each GLASS layer.

Edit the Brand Kit with club name, teams, logos, colors, system fonts, sponsors and other assets. Add only artwork you are allowed to use and record its license or permission. Save a composition as a preset for the club. In **Photo and layers**, upload a background, adjust crop/zoom/blur, add text, shape, image or GLASS layers, and change positions or sizes. A subject overlay must be a transparent PNG with the same source dimensions as the background photo.

The preview uses the same 2D renderer and dimensions as **Download PNG**. External images that fail to load or lack CORS permission show a warning; upload a local copy you are permitted to use if needed. PostMAKER does not upload to Instagram or publish a site.
