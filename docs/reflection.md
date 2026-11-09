# Reflection and Visual-Encoding Justification

**One-page reflection; peer evaluation pending**

Food Budget Atlas compares food spending as a share of total expenditures across income quintiles. The **Effectiveness Principle and Cleveland and McGill ranking** (Week 4, PDF pp. 18, 24) favor position for accurate comparisons: share uses a common 0–20% axis, while circle area carries the secondary dollar amount. Fixed scales preserve comparisons across filters but compress small differences. Away-from-home stacked segments have shifting baselines, so their lengths are harder to compare than dot positions; selecting Away from home makes that comparison available on a common baseline.

The **Expressiveness Principle** (Week 4, PDF p. 17) requires channels to fit data types. Quintiles retain ordinal row order, years run left to right, and two hues identify nominal food categories. Circle radius uses a square-root scale so area is proportional to dollars. **Focus plus context and direct labeling** (Week 6, PDF pp. 6, 10–11) keep one trend dark and thick while four labeled context lines remain visible. On narrow screens, endpoint labels are omitted to prevent crowding; the selected-group caption and linked tables preserve identification. The two-category legend, fixed segment order and selection outlines reduce dependence on hue alone.

**Gestalt proximity, similarity and enclosure** (Week 4, PDF pp. 39–42) group the two same-year comparisons in matching cards, with a wider time view below. The KPI-first hierarchy also follows Week 5 (PDF p. 37). Three equal columns would shorten the time axis; the chosen arrangement instead requires more vertical scrolling. Subtle guides and limited decoration apply the **data-ink principle** (Week 4, PDF p. 37).

Week 6 warns against the **hover-only trap** (PDF p. 15) and calls for accessible alternatives (pp. 26, 37). Updated insight titles describe the current data; native tables expose exact amounts and shares, CSV export provides all 50 records, and printing includes the tables. Meaningful marks use at least 3:1 contrast against white, with keyboard selection and visible focus. Collapsible tables keep the main view compact but add one action before detailed reading. Browser color-vision simulations and automated checks provide limited evidence, not a substitute for real assistive-technology users.

The **shared-state coordination pattern** (Week 9, PDF p. 37) propagates year, category and quintile selections across all views. Brief transitions help track changing positions, while static comparisons remain visible; reduced-motion preferences disable transitions. This addresses the animation/memory tradeoff discussed in Week 6 (PDF pp. 19–20). Only the focused trend has clickable year targets to avoid overlapping targets; the other charts select quintiles. Real peer feedback is still pending. I can explain the calculations, shared state and linked updates in the code.

**Interpretive limit:** BLS group means in current dollars describe expenditure patterns, not individual households, inflation-adjusted purchasing power or causal explanations. AI assistance is disclosed in sources.md.

## Channel justification table — current implementation

| Data variable | Data type | Mark | Channel | Principle | Justification |
| --- | --- | --- | --- | --- | --- |
| Food share of expenditures | Quantitative | Dot; bar segment; line point | X-position / length; Y-position | Effectiveness | Common scales support comparison; away segments use length from a shifting baseline. |
| Income quintile | Ordinal | Dot / bar row; line | Ordered Y-position; direct labels | Expressiveness | Row order preserves income rank; labels identify lines. |
| Calendar year | Temporal ordinal | Line point | X-position | Convention | Left-to-right position conveys chronology. |
| Food at home / away | Nominal | Bar segment | Hue; segment order | Expressiveness | Two hues identify categories; order also works in grayscale. |
| Annual all-food dollars | Quantitative | Dot | Area | Expressiveness | Zero-based square-root radius makes area proportional to dollars. |
