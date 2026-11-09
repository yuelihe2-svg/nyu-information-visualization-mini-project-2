"""Build the English engineering audit, separate from the pending peer report."""
from pathlib import Path
import json
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, PageBreak

ROOT=Path(__file__).resolve().parents[1]
audit=json.loads((ROOT/'output/prototype/comprehensive-verification.json').read_text(encoding='utf-8'))
assert audit.get('status')=='passed', 'Run the complete audit before authoring its report.'
OUT=ROOT/'output/pdf/engineering-qa-report.pdf'
N=colors.HexColor('#17333a'); M=colors.HexColor('#536a64'); G=colors.HexColor('#d8dfda')
styles={
 'title':ParagraphStyle('title',fontName='Helvetica-Bold',fontSize=21,leading=25,textColor=N,spaceAfter=14),
 'h':ParagraphStyle('h',fontName='Helvetica-Bold',fontSize=11,leading=15,textColor=N,spaceBefore=11,spaceAfter=7),
 'p':ParagraphStyle('p',fontName='Helvetica',fontSize=9.5,leading=13.5,textColor=N,spaceAfter=8),
 'small':ParagraphStyle('small',fontName='Helvetica',fontSize=8,leading=11,textColor=M,spaceAfter=7),
 'cell':ParagraphStyle('cell',fontName='Helvetica',fontSize=8.2,leading=11.3,textColor=N),
 'th':ParagraphStyle('th',fontName='Helvetica-Bold',fontSize=8.2,leading=11.3,textColor=colors.white),
}
def p(t,s='p'):return Paragraph(t,styles[s])
def table(rows,widths):
 t=Table([[p(str(c),'th' if i==0 else 'cell') for c in row] for i,row in enumerate(rows)],colWidths=widths,repeatRows=1)
 t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),N),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#eef2ef'),colors.white]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
 return t
story=[p('Lecture audit &amp; engineering QA','title'),p('Food Budget Atlas | Yueli He | November 9, 2026','small'),p('<b>Scope:</b> Review of the lecture sequence and close reading of relevant encoding, time-series, interaction and accessibility pages. The implementation was checked against the current assignment rubric. This report documents software verification; it is not the required two-peer usability report.'),p('Lecture principles translated into concrete behavior','h')]
story.append(table([
 ['Lecture reference (PDF page)','Application and tradeoff'],
 ['Week 2, p. 48<br/>Avoid truncated Y-axes','Trend zoom retains zero and changes only the upper limit. Every group/year in the category uses the same range; dots and bars remain 0-20%. This limits magnification but avoids the nonzero baseline criticized in class.'],
 ['Week 4, pp. 17-18, 24, 26<br/>Expressiveness, effectiveness, discriminability','Share uses position; quintiles retain ordinal order; category uses two hues; dollars use proportional circle area. A three-value size legend now decodes this secondary channel.'],
 ['Week 4, pp. 32, 39-42<br/>Change blindness and Gestalt','Persistent marks, brief interruptible transitions, matching cards and a consistent hierarchy support tracking and grouping. Reduced-motion mode applies updates immediately.'],
 ['Week 5, pp. 32, 37-38<br/>Small multiples and hierarchy','Five ordered panels use identical axes; a switch retains the compact overlay alternative. KPI-first layout and collapsible data tables prioritize the main comparison without hiding exact data permanently.'],
 ['Week 6, pp. 6, 10, 14-15, 24, 37<br/>Focus/context, labels, non-hover access','Selected lines use dark/thick strokes; titles respond to filters. Exact values are available through focus, native tables and CSV. Facets reduce line overlap, at the cost of vertical space on phones.'],
 ['Week 8, pp. 43-44<br/>Undo and uncertainty','Undo restores filters and presentation settings, including pre-reset state. The income dropdown offers a native selection path. Notes disclose group means, annual re-ranking and absent sampling uncertainty.'],
 ['Week 9, p. 37<br/>Shared state','Every chart and control updates one state object; figures, tables and descriptions stay coordinated. No network or 3D view was added because the research questions concern ordered groups and annual change.'],
],[170,358]))
story += [Spacer(1,9),p('References use PDF page numbers, which may differ from printed slide numbers. The Week 4 pre-submission checklist is PDF p. 47 (printed Slide 46). Real-user feedback on that checklist remains pending.','small')]
story += [PageBreak(),p('Verification results','title'),p('Frozen source and independent calculations','h'),p('All 20 saved BLS series and 200 expenditure values match the raw response. The wide table has 50 unique year-quintile records; the category table has 100 records. Types, missing values, rank, component rounding and derived percentages pass. Eight invalid-data fixtures are rejected before drawing; a corrupted portable file shows an alert instead of misleading charts.')]
rows=[['Test area','Observed result']]
rows += [
 ['Exhaustive states','Edge and Firefox each test 600 combinations: 10 years x 5 groups x 3 categories x 2 layouts x 2 scales. Shares, dollars, low-high gaps, annotation context and all 50 trend-point Y-positions agree with the CSV.'],
 ['Linked views and recovery','Separate tests select dots, bar segments and trend/facet points. All views and tables update. Undo restores the full state; Reset restores the default and can itself be undone.'],
 ['Motion and rapid input','Intermediate geometry, latest-selection settling, rapid layout/zoom changes, reduced motion and persistent keyboard focus pass. No stale final geometry or uncaught browser errors were observed.'],
 ['Responsive and keyboard','Both engines pass open-table reflow and facet-label containment at 320, 390, 600, 768, 900, 1000, 1280, 1440 and 1920 px. Skip link, native headers, Space, Escape and focus retention pass. Edge emulated touch selects a facet point correctly.'],
 ['Automated accessibility','Six axe scans (default, facets/zoom and mobile in two engines) report zero detected violations. The aria-prohibited-attr and color-contrast rules also return incomplete items requiring review. This is not a compliance certification.'],
 ['Export and offline use','Both browsers open the standalone file with networking disabled and no HTTP requests. CSV has all 50 records and correct amounts. Edge print output retains selection, includes exact tables and restores the disclosure state.'],
 ['Contrast and visual review','Essential data-mark contrast is at least 3.82:1 on white. Selection also uses outlines, stroke width and text. Four browser simulations and grayscale were reviewed; see limits on the next page.'],
]
story.append(table(rows,[120,408]))
story += [p('Measured performance on this machine','h')]
for b in audit['browsers']:
 story.append(p(f"{b['name']} {b['version']}: offline startup {b['performance']['offline_load_ms']} ms; 95th-percentile scripted update batch {b['performance']['update_batch_p95_ms']} ms.",'small'))
story.append(p('Measurements are one local run, not a performance guarantee. An update batch may trigger several synchronous renders; the reduced-motion audit does not time the 420 ms animation duration.','small'))
story += [PageBreak(),p('Findings, limits &amp; reproduction','title'),p('Issues found and corrected','h'),p('<b>Compressed trend lines:</b> switch to identical-axis facets or zero-based trend zoom. <b>Weak recovery:</b> add Undo and a native income-group selector. <b>Undecoded area:</b> add a dollar-size legend. <b>Misleading context:</b> label the hero as an all-food overview and add selected-year changes with a noncausal note. <b>Resize edge case:</b> constrain SVGs while the resize observer redraws. <b>Unvalidated source:</b> reject malformed data and expose a clear error state.'),p('Checks that still need people or additional equipment','h'),table([
 ['Remaining item','Why the current evidence is insufficient'],
 ['Classroom demonstration and feedback','Live attendance, demonstration and the real half-page feedback log have not occurred. A script or blank template cannot satisfy them.'],
 ['Final usability study','Two real peers must each attempt three tasks. Record observations, quotes, issues, resulting changes and before/after evidence in the required 2-3 page report. Automated tests do not replace this.'],
 ['Assistive technology and vision','NVDA/VoiceOver and real assistive-technology users were not tested. Simulations cover deuteranopia, protanopia, tritanopia and achromatopsia, not all eight conditions mentioned in Week 6. axe incomplete results require human review.'],
 ['Other platforms and data limits','No Safari/WebKit or physical mobile device testing. Browser printing supplies a data report, not a screenshot of charts. No confidence intervals were available in the frozen extract; small differences cannot be assumed statistically meaningful.'],
 ],[145,383]),p('Reproduce the evidence','h'),p('From source/, run <b>npm ci</b>, <b>npm run build:portable</b>, then <b>python scripts/check_data.py</b>. Run <b>npx playwright install firefox</b>, then <b>node scripts/check_comprehensive.mjs</b>. The Windows browser scripts use Microsoft Edge at its standard installation path. Playwright and axe are locked development dependencies; they are not needed to open the dashboard.'),p('Also run check_prototype.mjs and check_trend_modes.mjs. For check_dashboard.mjs and check_transitions.mjs, set DASHBOARD_URL to the standalone file URL, or run the local server at port 4173. capture_prototype.mjs refreshes the two annotated screenshots. PDF builders require ReportLab and Windows Georgia fonts.','small'),p('Evidence and provenance','h'),p('comprehensive-verification.json records browser versions, completed checks and SHA-256 hashes of the tested app/data files. verification.json and trend-verification.json provide additional checks. The source package includes all test scripts. OpenAI Codex assisted with implementation, documentation and testing; data and software attribution appear in source/docs/sources.md.','small')]
def footer(c,d):
 c.setFillColor(M);c.setFont('Helvetica',8);c.drawString(42,762,'NYU TANDON / INFORMATION VISUALIZATION');c.setStrokeColor(G);c.line(42,43,570,43);c.drawString(42,29,'Food Budget Atlas | Engineering audit, not peer-testing evidence');c.drawRightString(570,29,str(d.page))
SimpleDocTemplate(str(OUT),pagesize=(612,792),leftMargin=42,rightMargin=42,topMargin=57,bottomMargin=57,title='Food Budget Atlas - Lecture audit and engineering QA',author='Yueli He').build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT)
