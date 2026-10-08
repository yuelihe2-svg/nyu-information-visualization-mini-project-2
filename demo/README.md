# Annotated interaction screenshots

The three full-page screenshots below were captured from the working local app at 1280 px width. The beige banner in each image is a temporary annotation inserted for the screenshot; it is not part of the dashboard. Together the images demonstrate the three coordinated views and two selection paths.

1. [Overview](01-overview.png): all food in 2024, with five ordered quintiles and three view roles.
2. [Quintile selection](02-quintile-selection.png): selecting the highest-quintile dot updates the summary, composition emphasis, and trend highlight.
3. [Category and year selection](03-category-and-year.png): selecting the middle-quintile away-from-home segment changes the measured category; selecting a 2020 time point changes both year-specific charts and the summary.

These are **demonstration screenshots**, not usability-test before/after evidence. To regenerate them, run the development server on port 4173 and then `node scripts/capture_demo.mjs` on Windows with Microsoft Edge installed.
