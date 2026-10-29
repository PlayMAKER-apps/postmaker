# Extraction audit

## Sources reviewed

Checkout: `C:\Users\miche\OneDrive\Desktop\Basketball_Team_Tracker`, remote `https://github.com/nerone-basket/nerone-basket.github.io.git`, branch `main`, observed HEAD `7bf40e7`. The checkout was clean before work and was not edited.

| Source | Reusable behavior identified | Site coupling |
| --- | --- | --- |
| `site/app/graphic_generator_26/page.tsx` | Importing existing games | Next page, `sportsData`, `isClubTeam`, generated team assets |
| `site/components/graphic-generator.tsx` | Local editor state, CSV, image upload, glass placement, PNG download | Nerone defaults, Italian labels, club identity, `SiteGame`, fixed sponsor and logo lists |
| `site/components/graphic-generator.css` | Responsive editor patterns | Site styling and externally loaded fonts |
| `site/lib/graphic-generator.ts` | Canvas 2D rendering, image fitting, photo pan and zoom, layered GLASS, four graphic types | `@/lib/paths`, fixed backgrounds, Nerone-specific calendar columns, logos and sponsors |
| `site/public/assets/elementi_social/` | Four reference template assets | Original artwork; ownership and reuse terms not established |

## Provenance and rights

No root `LICENSE` or `NOTICE` was found in the Nerone checkout. Its README describes a specialized WebMAKER pilot, but does not grant a license for the graphic generator or bundled artwork. This repository therefore contains fresh code implementing generic behaviors, with no verbatim source extraction. Its Apache-2.0 license covers the new PostMAKER code; it does not assert rights over the Nerone source or club media. The logo supplied in the PlayMAKER workspace is used only for PostMAKER branding; any separate trademark rights remain with their owner.

The source imports `lucide-react` for icons and uses React. Its CSS requests Google Fonts Bebas Neue, Arimo, Anton, DM Sans and Archivo Black; Aharoni appears as a local fallback in Canvas text. Those fonts are not bundled here. The bootstrap uses system Arial and no third-party icon pack. React, Vite, TypeScript and their dependency licenses are managed by npm and are not copied into source.

## Excluded assets and data

No `elementi_social` PNG, club logo, sponsor artwork, player or team photo, roster, game database, hard-coded Nerone URL, or Nerone team name is included in the public build. The examples contain fictional teams and venues. Imported files and images are stored in the browser's IndexedDB until removed by the user or browser; an exported JSON backup is needed for durable recovery.

## Implementation limits

The new renderer supports all four composition categories and maintains the general layered GLASS model. Its layouts are new and do not reproduce Nerone's branded templates. The MVP editor supports layer geometry, subject cutout upload, sponsor/logo upload, shared matches and a public WebMAKER import. Calendar month grouping, full typography controls, richer score styling, browser integration tests and visual regression baselines remain to be developed. See the migration checklist.
