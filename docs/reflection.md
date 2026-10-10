# Reflection and Visual-Encoding Justification

**Draft for student review · approximately one page**

The central question in Food Budget Atlas is not who spends the most dollars on food; it is what share of annual expenditures food represents in each income quintile. I therefore placed the share on a common horizontal scale in the dot plot and stacked bars, and on a shared vertical scale in the time series. This follows the **Effectiveness Principle** and the **Cleveland and McGill perceptual ranking** discussed in Week 4 (slides 18 and 24): people compare positions more accurately than areas or angles. Circle area conveys the secondary dollar amount, while exact values remain available in the tooltip. The 0–20% scales stay fixed when the food category changes, which makes cross-filtered views comparable but gives small changes less visual resolution.

The **Expressiveness Principle** (Week 4, slide 17) also shaped the encodings. Income quintiles are ordinal, so I keep them in lowest-to-highest order rather than assigning arbitrary categorical hues. Year runs left to right on the line chart. At-home and away-from-home food are nominal categories, so two hues identify them in the stacked bars; color never stands for a numeric scale. The distinction remains legible in grayscale through segment order, lightness, and a two-item legend. In the time chart, the selected quintile is darker and thicker than the four context lines. This uses the Week 3 focus-and-context color guidance (slide 47) without demanding a five-color legend.

The layout applies **Gestalt proximity, similarity, and enclosure** from Week 4 (slides 39–42). The two views that compare the same five quintiles in one year sit beside one another inside matching cards. The time view spans the row below, because its ten-year axis needs width. Repeated type, spacing, and axes make the cards feel related, while the dark summary makes the active selection clear. I considered three equal columns, but that would squeeze the trend and weaken year comparisons. The chosen hierarchy gives the main budget-share question the first glance. Thin guides and restrained borders reflect Tufte's **data-ink ratio** discussion (Week 4, slide 37): marks and values, rather than decoration, carry the story.

Finally, the three views share a single selection. Clicking a dot selects a quintile; clicking a stacked segment selects a quintile and food category; clicking a dark time-series point selects a year. Every action updates the other views and the summary, so users can move from overview to a focused comparison and details on demand, consistent with the interaction guidance in Week 1 (slide 13) and Week 2. A tradeoff is that only the focused line's points are clickable: the five lines sometimes lie too close together for reliable independent targets. Quintile selection remains available in the other two views. This choice makes the interaction predictable, but real peer testing is needed to see whether users discover it naturally.

**Interpretive limit:** These are BLS group means in current dollars. The chart describes expenditure patterns; it does not show every household's experience or explain why a pattern changed.

## Channel justification table — current implementation

| Data dimension | Data type | Mark and channel | Reason |
| --- | --- | --- | --- |
| Food share of expenditures | Quantitative | Dot and bar horizontal position; line vertical position | The primary measure uses the most accurate channel and a common scale. |
| Income quintile | Ordinal | Ordered dot/bar rows; direct line labels | The rank is preserved without implying unrelated color categories. |
| Calendar year | Temporal ordinal | Line horizontal position | Left-to-right position conveys chronological order. |
| Food at home / away | Nominal | Stacked-bar hue and left/right position | Two consistent hues identify categories; position remains readable in grayscale. |
| Annual all-food dollars | Quantitative | Dot area | A secondary magnitude; zero-based square-root radius makes area proportional to dollars. |
