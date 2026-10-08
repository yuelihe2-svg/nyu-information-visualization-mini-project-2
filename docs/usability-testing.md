# Usability Testing Protocol and Report Template

**Status:** Protocol ready; two real peer sessions and the evidence-based report are pending. Do not submit the blank observation fields as a completed report. The assignment requires two peers, three tasks per peer, raw observations and quotes, prioritized issues, changes made in response, and before/after screenshots. The sections below are designed to become a 2–3 page report once real sessions are documented.

## Protocol

Recruit two peers who have not seen the dashboard or the BLS data. Test each peer separately with the same local app and browser size. Ask the tester to think aloud. Do not demonstrate interactions first; provide only the sentence: “This dashboard shows U.S. average annual food expenditures by income quintile. Please complete the three tasks while saying what you expect each click to do.” Record the date, tester alias, device/browser, task success, time or sequence, misclicks, pauses, exact comments, and any help given. Do not record names without permission.

**Task 1 — Compare.** In 2024, identify which income quintile spent the largest share of total expenditures on food, and report that share. Expected route: read or select a dot in View 1; expected answer: Lowest 20%, about 15.7%.

**Task 2 — Break down.** For the middle-income quintile in 2024, choose food away from home and report its share of total expenditures. Expected route: select the away segment in View 2; check that the category control, summary, and other charts update. Use the exact displayed value rather than supplying the answer to the tester.

**Task 3 — Follow time and reset.** For the same focused quintile and category, find the 2020 share, then return to the original all-food 2024 view. Expected route: choose a dark 2020 point in View 3 and use Reset view. Note whether the tester discovers the selected-line rule.

For each task, mark **success without help / success with help / unsuccessful**. Do not treat the test script above as observed behavior. The researcher should capture a screenshot of the original interface before sessions and of each genuine revision after sessions.

## Session record: peer 1

Tester alias: **[fill]** · Date/time: **[fill]** · Browser/device: **[fill]**

| Task | Outcome | Raw observations (actions, pauses, misclicks, time) | Exact quote, if offered | Help given |
| --- | --- | --- | --- | --- |
| 1 — Compare | [fill] | [fill] | [fill] | [fill] |
| 2 — Break down | [fill] | [fill] | [fill] | [fill] |
| 3 — Follow/reset | [fill] | [fill] | [fill] | [fill] |

## Session record: peer 2

Tester alias: **[fill]** · Date/time: **[fill]** · Browser/device: **[fill]**

| Task | Outcome | Raw observations (actions, pauses, misclicks, time) | Exact quote, if offered | Help given |
| --- | --- | --- | --- | --- |
| 1 — Compare | [fill] | [fill] | [fill] | [fill] |
| 2 — Break down | [fill] | [fill] | [fill] | [fill] |
| 3 — Follow/reset | [fill] | [fill] | [fill] | [fill] |

## Findings and prioritized issues

Write this section only after the sessions. Distinguish a repeated failure from one person's preference. For each issue, identify the evidence and severity: **P1** blocks a task, **P2** causes errors or delay, **P3** is a minor clarity or polish issue.

| Priority | Evidence from peer 1 and/or 2 | Why it matters | Specific design change | Re-test result |
| --- | --- | --- | --- | --- |
| [fill] | [fill] | [fill] | [fill] | [fill] |

## Before/after evidence and conclusion

**Before:** [Insert a dated screenshot of the interface feature associated with a real issue. Annotate the confusing target or label.]

**After:** [Insert a dated screenshot after the corresponding code change. Annotate the revised target or label.]

**What changed:** [State exactly what changed in the dashboard and which observation motivated it. If an issue remains, explain why.]

**What was learned:** [Summarize what the two participants could and could not do, citing specific evidence rather than general praise.]

The three screenshots in `demo/` show **dashboard interactions** for the access/demonstration deliverable. They are not presented as before/after peer-test evidence.
