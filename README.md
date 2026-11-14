# Food Budget Atlas

An interactive English-language dashboard for NYU Tandon's Information Visualization Mini-Project 2. It compares the share of annual U.S. consumer-unit expenditures spent on food across five income quintiles, separates food at home from food away from home, and follows the pattern from 2015 through 2024.

## Current working prototype

**Open the dashboard:** https://yuelihe2-svg.github.io/nyu-information-visualization-mini-project-2/

The public website requires no login or installation. It contains the latest project title, simplified two-part summary, consistent highest-to-lowest income order, and linked charts with Small multiples and Zoom.

For offline use, download `output/prototype/Food_Budget_Atlas.html` and open it in a browser. The latest two annotated screenshots are in `output/prototype/screenshots/`. Source code is on `main`; the self-contained public website is on `gh-pages`.

Older PDF/ZIP files in this repository are historical milestones. The current Week 7 course submission package, peer feedback and recording are kept separately for the course portal. The final structured usability study remains pending.

## Run locally

1. Install [Node.js](https://nodejs.org/) 20.19+.
2. In this repository, run `npm install` and then `npm run dev`.
3. Open the localhost URL printed by Vite. If port 5173 is available, this is usually `http://127.0.0.1:5173/`.

The source CSV is committed, so the dashboard does **not** need a BLS API request at runtime. `npm run build` creates a production build in `dist/`; `npm run preview` serves that build locally. No account or API key is needed. If npm's system cache is unwritable on Windows, use `npm install --cache .npm-cache`.

`npm run build:portable` generates the self-contained `output/prototype/Food_Budget_Atlas.html`. The portable build uses system font fallbacks and embeds the data, styles and D3 code. `python scripts/build_prototype_package.py` creates the PDF and ZIP after screenshots and verification have been generated; PDF generation needs ReportLab and the Windows Georgia fonts.

## Explore

- **View 1 — Compare:** select a dot to focus an income quintile. Dot area represents annual food dollars; horizontal position represents food as a share of total expenditures.
- **View 2 — Break down:** select an at-home or away-from-home segment to focus both its quintile and category.
- **View 3 — Follow time:** select a dark point on the focused quintile's line to change the year. The year dropdown is a second way to change years.
- Any selection updates the summary and the other views. `Reset view` returns to all food, the lowest income quintile, and 2024. Hover for details. SVG marks and controls support keyboard selection.
- Chart marks move between selections over 420 ms. Rapid selections interrupt the current transition; system reduced-motion preferences switch to immediate updates.

## Data and interpretation

The [BLS Consumer Expenditure Surveys](https://www.bls.gov/cex/) supply annual average expenditures per **consumer unit**, grouped by quintiles of **income before taxes**. The app uses 50 year–quintile records (2015–2024 × five quintiles) with four original spending measures: total expenditures, all food, food at home, and food away from home. A companion 100-row tidy extract makes `food_category` an explicit nominal variable. `scripts/fetch_data.py` retrieves 20 BLS series from the [BLS Public Data API](https://www.bls.gov/developers/api_signature_v2.htm), validates completeness and published rounding, and writes the raw response and both processed CSVs. To refresh the frozen data, run `python scripts/fetch_data.py` (Python 3 standard library only).

The main measure is `food spending / total expenditures × 100`. Home and away shares use the same denominator. Means are group averages, so the chart does not describe every household. Dollar figures are current dollars and are **not inflation adjusted**. The views describe spending patterns and cannot determine food insecurity, causality, or why shares changed. BLS-rounded components can differ from the BLS food total by up to $2.

## Coursework deliverables

- [Week 5 proposal PDF](output/pdf/week5-proposal.pdf) and [optional supporting-data package](output/Week5_Submission.zip): dataset, three research questions, three layout sketches, and channel justification table. Rebuild with `scripts/build_week5_package.py` using Python with ReportLab and Windows Georgia fonts.
- [Proposal, research questions, channel table, and three layout sketches](docs/proposal.md)
- [Usability protocol and structured report template](docs/usability-testing.md) — the required two-peer sessions remain to be conducted honestly.
- [One-page reflection draft](docs/reflection.md)
- [One-page reflection PDF](output/pdf/reflection.pdf)
- [Sources and AI-assistance disclosure](docs/sources.md)
- [Three annotated interaction screenshots](demo/README.md)

The proposal and reflection are drafts for the student's own design review, as required by the course's academic-integrity instructions. No peer observations or quotations have been invented.

## Verification

Run `npm run build` for the production build. With `npm run dev -- --port 4173` running, `node scripts/check_dashboard.mjs` checks selections originating in all three views, reset behavior, browser errors, and mobile horizontal overflow. The script uses a local Microsoft Edge installation through Playwright; the dashboard itself has no Edge dependency.

`node scripts/check_transitions.mjs` checks intermediate animation geometry, persistent marks, rapid selections, reduced-motion behavior, and keyboard focus retention.

`python scripts/check_data.py` validates the CSVs against the frozen BLS API response. After building the portable file, `node scripts/check_prototype.mjs` checks offline startup, all 150 selection combinations, keyboard details and responsive widths. Set `DASHBOARD_URL` to a preview URL or a portable `file:///...` URL to run the other two check scripts against a specific build. `node scripts/capture_prototype.mjs` generates the two current prototype screenshots.

## Implementation

The dashboard uses D3.js for SVG scales, axes, marks, and data loading, and Vite to build the local application. `src/main.js` holds the shared selection state and chart renderers. `src/styles.css` provides the visual hierarchy, responsive layout, and focus states. No third-party chart template was adapted. Code and data provenance are documented in [sources](docs/sources.md).


## November 9 lecture-based improvements

Week 6 (PDF pp. 6, 10–15, 19–20, 26, 37) informs focus/context, direct labels, data-derived insight titles, reduced motion and non-hover access. Native tables update with the year/quintile; all 50 records can be downloaded as CSV. Print/save-PDF expands the tables automatically. Essential data marks retain at least 3:1 contrast on white, including nonselected categories; outlines and line width communicate selection. Week 9 (PDF p. 37) supports the shared selection state.

The package includes `Reflection.pdf` with lecture references, tradeoffs and the updated channel table. Browser simulations cover protanopia, deuteranopia, tritanopia and achromatopsia; they do not establish universal color-vision accessibility. Real screen-reader testing, classroom feedback and the final two-peer usability report remain pending. Automated verification is documented separately from human feedback.


## Trend comparison modes

**Overlaid trends** compares relative levels; **Small multiples** separates the five income quintiles into ordered panels (Week 6, PDF pp. 8–9). All panels share the 2015–2024 X-axis and identical Y-axis. Clicking a facet point selects both its quintile and year across all views and tables. Panels stack on narrow screens.

**Zoom Y-axis** changes only the trend scale from 0–20% to a category-wide range: zero through ceiling(maximum share plus 0.5 percentage points). All 50 observations determine the extent, so changing the selected year/quintile cannot rescale the chart. An explicit message states the range and confirms that zero is retained, following the axis warning in Week 2 (PDF p. 48). Dot/bar scales remain 0–20%; Reset restores the original layout and scale.

Facets remove overlap but consume space; zoom reveals differences but magnifies their appearance. These zoom bounds are an implementation choice, not a numerical rule from the lecture. The second screenshot demonstrates Small multiples + Zoom. `trend-verification.json` records checks of all 12 category/layout/scale combinations and 150 facet selections. Run `node scripts/check_trend_modes.mjs` after building the portable HTML.

## Lecture audit and engineering QA

The income dropdown, Undo, zero-preserving trend zoom, numeric size legend, source-data validation and year-to-year annotation were added after the lecture review. `output/pdf/engineering-qa-report.pdf` documents evidence and limits. To reproduce the additional audit after building: `npx playwright install firefox`, then `node scripts/check_comprehensive.mjs`. It checks 600 states in each of Edge and Firefox, axe accessibility rules, nine responsive widths, keyboard/touch paths, offline export and invalid-data handling. Browser tests do not replace the outstanding real peer sessions or screen-reader evaluation.
