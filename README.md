# Food Budget Atlas

An interactive English-language dashboard for NYU Tandon's Information Visualization Mini-Project 2. It compares the share of annual U.S. consumer-unit expenditures spent on food across five income quintiles, separates food at home from food away from home, and follows the pattern from 2015 through 2024.

## Run locally

1. Install [Node.js](https://nodejs.org/) 20.19+.
2. In this repository, run `npm install` and then `npm run dev`.
3. Open the localhost URL printed by Vite. If port 5173 is available, this is usually `http://127.0.0.1:5173/`.

The source CSV is committed, so the dashboard does **not** need a BLS API request at runtime. `npm run build` creates a production build in `dist/`; `npm run preview` serves that build locally. No account or API key is needed. If npm's system cache is unwritable on Windows, use `npm install --cache .npm-cache`.

## Explore

- **View 1 — Compare:** select a dot to focus an income quintile. Dot area represents annual food dollars; horizontal position represents food as a share of total expenditures.
- **View 2 — Break down:** select an at-home or away-from-home segment to focus both its quintile and category.
- **View 3 — Follow time:** select a dark point on the focused quintile's line to change the year. The year dropdown is a second way to change years.
- Any selection updates the summary and the other views. `Reset view` returns to all food, the lowest income quintile, and 2024. Hover for details. SVG marks and controls support keyboard selection.

## Data and interpretation

The [BLS Consumer Expenditure Surveys](https://www.bls.gov/cex/) supply annual average expenditures per **consumer unit**, grouped by quintiles of **income before taxes**. The app uses 50 year–quintile records (2015–2024 × five quintiles) with four original spending measures: total expenditures, all food, food at home, and food away from home. A companion 100-row tidy extract makes `food_category` an explicit nominal variable. `scripts/fetch_data.py` retrieves 20 BLS series from the [BLS Public Data API](https://www.bls.gov/developers/api_signature_v2.htm), validates completeness and published rounding, and writes the raw response and both processed CSVs. To refresh the frozen data, run `python scripts/fetch_data.py` (Python 3 standard library only).

The main measure is `food spending / total expenditures × 100`. Home and away shares use the same denominator. Means are group averages, so the chart does not describe every household. Dollar figures are current dollars and are **not inflation adjusted**. The views describe spending patterns and cannot determine food insecurity, causality, or why shares changed. BLS-rounded components can differ from the BLS food total by up to $2.

## Coursework deliverables

- [Proposal, research questions, channel table, and three layout sketches](docs/proposal.md)
- [Usability protocol and structured report template](docs/usability-testing.md) — the required two-peer sessions remain to be conducted honestly.
- [One-page reflection draft](docs/reflection.md)
- [One-page reflection PDF](output/pdf/reflection.pdf)
- [Sources and AI-assistance disclosure](docs/sources.md)
- [Three annotated interaction screenshots](demo/README.md)

The proposal and reflection are drafts for the student's own design review, as required by the course's academic-integrity instructions. No peer observations or quotations have been invented.

## Verification

Run `npm run build` for the production build. With `npm run dev -- --port 4173` running, `node scripts/check_dashboard.mjs` checks selections originating in all three views, reset behavior, browser errors, and mobile horizontal overflow. The script uses a local Microsoft Edge installation through Playwright; the dashboard itself has no Edge dependency.

## Implementation

The dashboard uses D3.js for SVG scales, axes, marks, and data loading, and Vite to build the local application. `src/main.js` holds the shared selection state and chart renderers. `src/styles.css` provides the visual hierarchy, responsive layout, and focus states. No third-party chart template was adapted. Code and data provenance are documented in [sources](docs/sources.md).
