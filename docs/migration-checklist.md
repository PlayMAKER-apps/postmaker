# Migration checklist

| Nerone capability | PostMAKER bootstrap | Next work |
| --- | --- | --- |
| Calendar composition | Basic generic match list renderer | Month grouping, overflow handling, two-column layout |
| Week post and story | Both canvas sizes, editable match glass layers, independent match selection and subject PNG upload | Drag handles and richer glass styling |
| Matchday composition | Basic generic renderer | Refine controls for uploaded logos and template styling |
| Result composition | Scores and logos | Featured-team score styling and manual selection |
| Canvas 2D preview | Live prototype preview | Better editor error handling and accessibility |
| Background photo, pan, zoom, blur | Core and editor controls; uploads have size and dimension limits | Better crop preview and memory profiling |
| PNG export | Core and prototype download | Browser integration test and filename options |
| Existing game import | Generic CSV plus validated WebMAKER public club 0.1 file/HTTPS import | Studio-side export adapter and richer refresh merge choices |
| Manual match fallback | Create, edit and remove shared matches | Team picker from Brand Kit |
| Sponsor and logos | Brand Kit uploads, sponsor and asset library | License-aware asset browser |

The Nerone route `/graphic_generator_26` remains in its original repository. No redirect or retirement is part of this migration.

## Recommended next issue

Add browser integration and visual regression tests for the four templates, including reopen from IndexedDB, subject overlays, PNG export and project JSON round trips.
