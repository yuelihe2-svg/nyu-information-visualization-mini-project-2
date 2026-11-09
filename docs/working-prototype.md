# Working Prototype: Food Budget Atlas

**Author:** Yueli He

**Course:** Information Visualization, NYU Tandon

**Prepared:** November 9, 2026

**Stage:** Mid Submission / Working Prototype

## Start the dashboard

Extract `Working_Prototype_Package.zip` and open `Food_Budget_Atlas.html` in a modern browser. This portable copy includes D3, styles, and the frozen BLS data; it needs no server, installation, account, or network connection. The BLS source link requires internet access if opened. The portable version uses Georgia/Arial font fallbacks.

For editable source, use the `source/` folder in the package: install Node.js 20.19+ or 22.12+, run `npm ci`, then `npm run dev`. The CSVs are included. Run `npm run build:portable` to rebuild the standalone HTML. The repository is https://github.com/yuelihe2-svg/nyu-information-visualization-mini-project-2 . A private repository needs explicit grader access; the ZIP provides the same source without requiring repository access. If the portal requires a repository URL, grant the instructor access and include that URL alongside the package.

## Response to proposal feedback

The instructor accepted the dataset and research questions, but asked for more specific visuals, a clearer explanation of how they tell a story together, and a dedicated cover page. The prototype brief now includes a separate cover and a detailed, data-based layout diagram with dots, stacked bars, line trajectories, axes, category colors, and selection arrows. The two annotated screenshots document the actual working implementation.

The narrative follows three research questions:

1. **Compare:** Which income groups devote the largest expenditure share to food? The horizontal dot plot compares five ordered quintiles on a common 0-20% scale. Circle area adds annual all-food dollars as a secondary measure.
2. **Break down:** How much comes from at-home and away-from-home food? Stacked bar segments use the same total-expenditure denominator. Their lengths, not the right edge of the away segment alone, represent category shares.
3. **Follow time:** How did those shares change from 2015 to 2024? Straight line segments connect annual observations. The selected quintile is dark and thick; the other four remain as labeled context at desktop width.

These are descriptive comparisons of BLS group means. They do not establish causal effects, household-level distributions, food insecurity, or inflation-adjusted purchasing power.

## Prototype rubric evidence

| Criterion (4 points each) | Evidence in the package | Status |
| --- | --- | --- |
| Data loaded and prepared | 50 wide records, 100 tidy category records; numeric conversion; no missing fields or duplicate observation keys; transformations and rounding documented | Implemented and checked |
| Views implemented | Dot plot, stacked bars, and trend lines; each tied to one research question | Implemented and checked |
| Encodings applied | Five dimensions, quantitative/ordinal/nominal types, six-column channel table | Implemented and checked |
| Basic interaction and linking | Selection from each view updates the other two, tooltips, reset, keyboard operation and 420 ms transitions | Implemented and checked |
| Peer feedback session | Live attendance and demonstration; feedback log of at most half a page identifying people, issues and planned changes | Pending the actual session |

This 20-point prototype rubric contributes 5 project points after division by four. Automated checks do not establish classroom participation or replace peer testing.

## Verification

`verification.json` records checks of all 150 year/category/quintile combinations, offline startup, keyboard tooltips and selection, viewport containment, and no horizontal overflow at 320, 390, 768, 1280 and 1600 px. Separate interaction checks cover selection originating in all three views, reset, interrupted animation, reduced-motion preferences, and retained keyboard focus.

## Submission contents

- `Working_Prototype_Brief.pdf`: dedicated cover, detailed layout, data/encoding justification, access and demonstration notes.
- `Food_Budget_Atlas.html`: the working portable dashboard.
- `screenshots/01-overview.png` and `screenshots/02-linked-selection.png`: two annotated screenshots.
- `source/`: editable code, frozen data, source citations, setup instructions, and build/check scripts.
- `preparation/`: English demonstration notes and a blank short-feedback template. This template is not completed evidence. Replace it with an actual log after the session, limited to half a page.

The final submission additionally requires the genuine two-peer, three-tasks-per-peer usability study, its 2-3 page report, changes tied to findings and before/after evidence. That final report is not claimed in this prototype package.


## November 9 lecture-based improvements

Week 6 (PDF pp. 6, 10–15, 19–20, 26, 37) informs focus/context, direct labels, data-derived insight titles, reduced motion and non-hover access. Native tables update with the year/quintile; all 50 records can be downloaded as CSV. Print/save-PDF expands the tables automatically. Essential data marks retain at least 3:1 contrast on white, including nonselected categories; outlines and line width communicate selection. Week 9 (PDF p. 37) supports the shared selection state.

The package includes `Reflection.pdf` with lecture references, tradeoffs and the updated channel table. Browser simulations cover protanopia, deuteranopia, tritanopia and achromatopsia; they do not establish universal color-vision accessibility. Real screen-reader testing, classroom feedback and the final two-peer usability report remain pending. Automated verification is documented separately from human feedback.
