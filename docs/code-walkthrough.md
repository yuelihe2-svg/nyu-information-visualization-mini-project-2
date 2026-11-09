# Explaining the dashboard code

Use this as a study guide before the classroom demonstration. The source file is `src/main.js`.

## How a selection reaches all three charts

The `state` object stores three data selections (`year`, `quintile`, `type`) and two presentation settings (`trendMode`, `zoom`). A click handler calls `select(next)`, which merges the changed values into that shared state and calls `render(true)`. Rendering updates the summary, dot plot, stacked bars and time chart from the same selection. No chart maintains a conflicting private filter.

For example, selecting the Middle away-from-home segment sets `quintile` to `Middle` and `type` to `away`. Selecting its 2020 time point then sets `year` to `2020`. The other two state values remain unchanged.

## Where the numbers come from

`init()` loads the committed BLS CSV with D3. Unary `+` converts the numeric CSV strings to numbers. `field(type)` selects the all-food, at-home or away-from-home expenditure column. `share(row, type)` divides that column by total expenditures and multiplies by 100.

In the default 2024 Lowest record, food spending is $5,498 and total expenditures are $35,046. The displayed share rounds `100 * 5498 / 35046` to 15.7%. This is a ratio of published group means, not the average of individual households' food-share ratios.

## Why the marks appear where they do

- The dot plot's linear x-scale maps 0-20% to the plot width. The band y-scale keeps income quintiles in rank order. A square-root scale maps all-food dollars to radius, so circle area is proportional to dollars.
- The stacked bars compute home and away shares separately. Home starts at zero; away starts at the end of home. Segment width represents its own share of total expenditures. Comparing away segments requires comparing lengths rather than right-edge positions.
- The trend chart maps year to x and share to y. Each quintile has one path; straight segments connect the ten annual observations. The selected line is thicker and darker. In overlay mode, only that line has interactive year targets. In facet mode, every panel has targets that select both quintile and year.

The default percentage domains are 0-20%. Dot/bar domains always stay fixed. Optional trend zoom uses one category-wide range and explicitly states that zero is excluded; all facets keep identical scales.

## How animation works

The SVGs and marks persist between renders. Keyed D3 data joins match a quintile, segment or year to its existing mark. `motion()` interrupts the previous named transition and moves from the currently displayed geometry to the new geometry over 420 ms. A rapid click therefore does not queue an old selection. When `prefers-reduced-motion` is active, attributes update immediately.

## Access and reliability

Mouse and keyboard handlers call the same selection function. Enter and Space select; focus shows details; Escape hides the tooltip. Tooltips are kept inside the viewport. `ResizeObserver` redraws scales for the available width. `aria-pressed` exposes selection state and a polite status region announces the new values.

`scripts/build_portable.mjs` takes the production bundle and embeds its JavaScript, CSS and CSV data into one HTML file. It removes external font requests, using the existing system fallbacks. That is why the portable dashboard can run offline through `file://` without a server. The editable source remains separate in the package.

## Questions to practice answering

1. Why is the percentage denominator total expenditures rather than income or total food spending?
2. Why does circle area stay tied to all-food dollars when a category is selected?
3. How does a click in the time chart change the other views?
4. What do fixed axes improve, and what detail do they sacrifice?
5. What conclusions cannot be drawn from these group means?

These answers should reflect your understanding. A working program or a written statement does not itself demonstrate that understanding.


## Trend layouts and shared scales

`state.trendMode` selects overlay or facets; `state.zoom` controls only the trend Y-axis. `trendDomain()` computes the full [0,20] range or a padded extent of all 50 observations in the active food category. `drawOverlay()` and `drawFacets()` receive that same domain. Facets use equal scales, ordered panels and persistent point targets; clicking one changes both `quintile` and `year` through `select()`. A quintile/year change never changes the zoom domain. Reset also restores overlay mode and the full axis. The text below the controls explicitly identifies a nonzero baseline. The native tables retain exact values regardless of the layout.
