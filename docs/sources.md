# Sources, Methods, and AI Assistance

## Primary data

- Publisher: U.S. Bureau of Labor Statistics (BLS), [Consumer Expenditure Surveys](https://www.bls.gov/cex/).
- Access method: [BLS Public Data API v2](https://www.bls.gov/developers/api_signature_v2.htm), `POST https://api.bls.gov/publicAPI/v2/timeseries/data/`, accessed 2026-10-08.
- Series naming and demographic codes: BLS [CE LABSTAT data guide](https://www.bls.gov/cex/labstat/ce-labstat-getting-started-guide.htm) and the `cx.series`, `cx.item`, and `cx.characteristics` metadata files in the [BLS time-series directory](https://download.bls.gov/pub/time.series/cx/). The API series are `CXU{ITEM}LB01{QUINTILE}M`, where `ITEM` is `TOTALEXP`, `FOODTOTL`, `FOODHOME`, or `FOODAWAY`, and `QUINTILE` is `02` through `06`. This yields 20 series.
- Cross-check and terminology: BLS [CE demographic tables](https://www.bls.gov/cex/tables/calendar-year/mean-item-share-average-standard-error.htm), [tables guide](https://www.bls.gov/cex/tables-getting-started-guide.htm), and [glossary](https://www.bls.gov/cex/csxgloss.htm).
- Raw API response: [`data/bls_api_2015_2024.json`](../data/bls_api_2015_2024.json). Processed wide app extract: [`data/food_spending.csv`](../data/food_spending.csv). Tidy category extract: [`data/food_spending_long.csv`](../data/food_spending_long.csv). Reproduction script: [`scripts/fetch_data.py`](../scripts/fetch_data.py).

## Transformation and quality checks

There are 10 years (2015–2024) × five quintiles = 50 wide rows and 100 tidy food-category rows. `scripts/fetch_data.py` checks that all 20 series and all 50 year–quintile combinations are present, every record contains all four measures, total expenditures exceed food spending, and food at home plus food away from home differs from published food total by no more than $2 due to rounding. The year is a calendar year; the underlying measure is mean annual spending per consumer unit. `food_share_percent = 100 × food_total_usd / total_expenditures_usd`. `away_share_of_food_percent` is included in the wide CSV for checking and future analysis but not used as a dashboard axis. The plotted home and away shares divide by **total expenditures**, so they approximately add to the total food share. The tidy file makes the nominal food category explicit; the dashboard reads the equivalent wide file for simpler rendering.

The lowest-to-highest quintile ordering uses income **before taxes**. Published mean expenditures are in **current dollars**, with no inflation adjustment. The API data are grouped estimates; the dashboard does not show microdata, confidence intervals, prices, household composition, or causal effects. The 2024 all-food budget shares calculated from the frozen extract are 15.7%, 14.8%, 13.6%, 13.2%, and 11.3% from lowest to highest quintile.

## Visual checks

On 2026-10-10, the dashboard was rendered in grayscale at desktop width. Home and away food segments remained distinguishable by lightness and consistent left/right order; the legend names both categories. Representative WCAG contrast calculations were 4.59:1 for the lightest row label on white, 4.75:1 for inactive control text on its pale background, 5.45:1 for card description text on white, and 8.38:1 for small summary text on navy. The orange hero phrase is large text and measured 3.33:1 against the page background. Severe deuteranomaly and protanomaly views were also simulated locally using [Colorspacious's documented CVD conversion](https://colorspacious.readthedocs.io/en/v1.1.2/tutorial.html#simulating-colorblindness); the two food-category fills remained visibly distinct in both. Simulations approximate perception rather than proving universal accessibility. The selected trend line also uses stronger stroke width and direct labeling, not hue alone.

## Lecture sources

Course PDFs provided by the instructor, located in the parent `information` directory:

- `InfoVis_Week1_Foundations .pdf` — visual seeking mantra and data-ink discussion.
- `InfoViz-week2 (2).pdf` — data quality checks, filtering, linked brushing, and ethics.
- `Week 3_Color_Theory.pdf` — accessible two-color palette, focus/context, grayscale review.
- `Week4_Visual_Encoding_Perception.pdf` — expressiveness, effectiveness, Cleveland and McGill, Gestalt, data-ink, and slide-46 checklist.

## Software and adapted material

- [D3.js](https://d3js.org/) (v7) is used as a library for SVG construction, scales, and data loading; [Vite](https://vite.dev/) builds the local app. [Playwright](https://playwright.dev/) is used only for local interaction checks and demonstration screenshots.
- No third-party dashboard template, code snippet, or tutorial was adapted. The dashboard layout, SVG renderers, state handling, CSS, documentation, and data-fetch script were generated for this project.
- Google Fonts [DM Sans](https://fonts.google.com/specimen/DM+Sans) and [Newsreader](https://fonts.google.com/specimen/Newsreader) are loaded for display; browser fallbacks are provided.

## AI assistance disclosure

| Date | Tool | Assistance | Student responsibility |
| --- | --- | --- | --- |
| 2026-10-08 | OpenAI Codex | Read assignment and lecture PDFs; identified official BLS series; generated data-fetch script, D3 dashboard, layout sketches, written drafts, local checks, and annotated demo screenshots. | Review and make final visual-design choices; understand and be able to explain submitted code and calculations; conduct two genuine peer tests; revise the final report and reflection in the student's own voice. |
| 2026-11-08 | OpenAI Codex | Responded to instructor feedback with a dedicated prototype cover and a detailed data-based chart diagram; added context labels, keyboard details, offline packaging, two prototype screenshots, a classroom rehearsal guide, and automated verification. | Conduct the actual classroom demonstration, collect and report genuine peer feedback, and complete the final usability study. |

The course allows AI assistance with code but requires student design decisions and citation of adapted material. The code and drafts here are disclosed; no peer testing results are claimed.


## Additional lecture review and implementation — November 9, 2026

Instructor PDFs supplied under `D:/Users/heelii/Downloads/` were reviewed for relevant guidance. References use PDF page numbers:

- `Week 5-2D_Visualization.pdf`: hierarchy (37), cognitive load (38). Small multiples refers to the five-panel trend mode; the three different chart types are coordinated views.
- `Week 6-TimeSeriesAccessibility.pdf`: focus/context (6), direct labels (10–11), insight titles (14), hover-only trap (15), animation tradeoffs (19–20), accessibility checklist (26), verification (37). This file has 40 PDF pages; printed slide numbering differs.
- `Week 7- Graph visualization.pdf`: coordinated graph/matrix views (44); no network structure was invented for the expenditure data.
- `Week_8-3D_Urban_Visualization.pdf`: dashboard organization (27), novice usability (43), uncertainty (44). No unsupported confidence intervals or 3D views were added.
- `Week 9-Advanced-UrbanViz.pdf`: shared state across linked views (37).

Codex assisted with this review and the implementation of native data tables, CSV export, print styles, data-derived chart titles, revised mark contrast, documentation and checks. The current palette replaces the earlier orange/context fills described in the historical October review. Data marks use teal #216d77, orange #b8622e, context #718783 and ink #17333a, with no opacity reduction. Browser simulations cover four types (protanopia, deuteranopia, tritanopia, achromatopsia), not all eight types listed in the lecture. Native table semantics and keyboard behavior were checked; no actual NVDA/VoiceOver user session is claimed. Student review of design decisions, code understanding and real peer testing remain required.


The November 9 trend revision applies Week 6 PDF pp. 6, 8–9 and 24: focus/context, small multiples with identical scales, and reducing overlapping lines. Week 5 PDF p. 32 also discusses small multiples. Codex implemented the user-selected layout switch and optional zoom, shared scale, zero-preserving scale disclosure, keyboard interactions and verification. This refinement follows the student's observation of overlapping lines; it is not recorded as a two-peer usability study.

The subsequent lecture audit checked Weeks 2-9 against the current implementation: zero-preserving zoom (Week 2 PDF p. 48), size discrimination and change blindness (Week 4 pp. 26, 32), common-axis small multiples (Week 5 p. 32), non-hover alternatives (Week 6 p. 15), Undo and uncertainty disclosure (Week 8 pp. 43-44), and shared state (Week 9 p. 37). Code additions and automated tests were AI-assisted. Test tooling adds the `@axe-core/playwright` package (Deque Systems; package metadata and lockfile identify its version). Automated accessibility results are not a WCAG certification. No actual screen-reader or peer evaluation has been performed.
