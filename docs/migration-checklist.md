# Migration checklist

| Nerone capability | PostMAKER bootstrap | Next work |
| --- | --- | --- |
| Calendar composition | Basic generic match list renderer | Month grouping, overflow handling, two-column layout |
| Week post and story | Both canvas sizes, match glass and layer rendering | Glass editor, independent match selection, subject cutout upload |
| Matchday composition | Basic generic renderer | Refine controls for uploaded logos and template styling |
| Result composition | Scores and logos | Featured-team score styling and manual selection |
| Canvas 2D preview | Live prototype preview | Better editor error handling and accessibility |
| Background photo, pan, zoom, blur | Core and prototype controls | Validate image dimensions and large uploads |
| PNG export | Core and prototype download | Browser integration test and filename options |
| Existing game import | `MatchSource`, mapper and generic CSV | Site-specific adapter outside the core package |
| Manual match fallback | Text controls for selected match | Full manual creation and deletion |
| Sponsor and logos | Optional image fields in core | User upload controls and asset library |

The Nerone route `/graphic_generator_26` remains in its original repository. No redirect or retirement is part of this migration.

## Recommended next issue

Build the full Week GLASS editor: add/remove/reposition match and sponsor panels, select independent imported matches, upload a same-size transparent subject PNG, and test post/story PNG output with synthetic fixtures.
