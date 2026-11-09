"""Create a reviewed prototype brief, detailed chart diagram and portable ZIP."""
import csv
import json
from math import sqrt
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.graphics.shapes import Drawing, Rect, String, Circle, Line, PolyLine, Polygon
from reportlab.graphics import renderSVG
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output'
PDF = OUT / 'pdf' / 'working-prototype-brief.pdf'
PDF.parent.mkdir(parents=True, exist_ok=True)
records = list(csv.DictReader((ROOT/'data/food_spending.csv').open()))
quintiles = ['Lowest', 'Second', 'Middle', 'Fourth', 'Highest']
N = colors.HexColor('#17333a'); T = colors.HexColor('#216d77'); O = colors.HexColor('#b8622e')
M = colors.HexColor('#536a64'); P = colors.HexColor('#eef2ef'); G = colors.HexColor('#cdd7d1')
pdfmetrics.registerFont(TTFont('Georgia', r'C:\Windows\Fonts\georgia.ttf'))
pdfmetrics.registerFont(TTFont('Georgia-Bold', r'C:\Windows\Fonts\georgiab.ttf'))
pdfmetrics.registerFontFamily('Georgia', normal='Georgia', bold='Georgia-Bold')
styles = {
    'title': ParagraphStyle('title',fontName='Georgia',fontSize=23,leading=28,textColor=N,spaceAfter=14),
    'heading': ParagraphStyle('heading',fontName='Georgia-Bold',fontSize=12,leading=16,textColor=N,spaceBefore=12,spaceAfter=7),
    'body': ParagraphStyle('body',fontName='Helvetica',fontSize=10,leading=14,textColor=N,spaceAfter=9),
    'small': ParagraphStyle('small',fontName='Helvetica',fontSize=8.5,leading=12,textColor=M,spaceAfter=7),
    'cell': ParagraphStyle('cell',fontName='Helvetica',fontSize=8,leading=10.5,textColor=N),
    'th': ParagraphStyle('th',fontName='Helvetica-Bold',fontSize=8,leading=10.5,textColor=colors.white),
}

def p(s,style='body'): return Paragraph(s,styles[style])
def table(rows,widths):
    result=Table([[p(c,'th' if i==0 else 'cell') for c in row] for i,row in enumerate(rows)],colWidths=widths,repeatRows=1)
    result.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),N),('ROWBACKGROUNDS',(0,1),(-1,-1),[P,colors.white]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
    return result

def share(row,field='food_total_usd'): return 100*float(row[field])/float(row['total_expenditures_usd'])

def detailed_layout():
    d=Drawing(528,433)
    def text(x,y,s,size=8,color=N,bold=False,anchor='start'):
        d.add(String(x,y,s,fontSize=size,fontName='Helvetica-Bold' if bold else 'Helvetica',fillColor=color,textAnchor=anchor))
    def line(x1,y1,x2,y2,color=G,width=.6): d.add(Line(x1,y1,x2,y2,strokeColor=color,strokeWidth=width))
    def box(x,y,w,h,fill=colors.white,stroke=G): d.add(Rect(x,y,w,h,fillColor=fill,strokeColor=stroke,strokeWidth=.7,rx=4,ry=4))
    def arrow(x1,y1,x2,y2,label,lx,ly):
        line(x1,y1,x2,y2,T,1.2)
        if y1==y2: points=[x2,y2,x2-5,y2+3,x2-5,y2-3]
        else: points=[x2,y2,x2-3,y2+5,x2+3,y2+5]
        d.add(Polygon(points,fillColor=T,strokeColor=T));text(lx,ly,label,7,T)
    box(1,396,526,35,N,N)
    text(14,417,'2024 / ALL FOOD / LOWEST INCOME QUINTILE',8,colors.white,True)
    text(14,403,'15.7% of total expenditures    |    $5,498 annual food spending',8,colors.white)
    box(1,205,254,180);box(273,205,254,180)
    text(12,368,'01  DOT PLOT / COMPARE',10,N,True)
    text(12,353,'Food share by ordered income quintile',7.5,M)
    text(284,368,'02  STACKED BARS / BREAK DOWN',10,N,True)
    text(284,353,'At-home + away shares of total expenditures',7.3,M)
    current=[next(r for r in records if r['year']=='2024' and r['income_quintile']==q) for q in quintiles]
    max_dollars=max(float(r['food_total_usd']) for r in records)
    for base in [65,337]:
        for tick in [0,5,10,15,20]:
            x=base+tick*8.5;line(x,235,x,342);text(x,223,f'{tick}%',6.5,M,anchor='middle')
    for i,row in enumerate(current):
        y=333-i*22
        text(9,y-3,quintiles[i],7,N,i==0)
        text(281,y-3,quintiles[i],7,N,i==0)
        radius=7*sqrt(float(row['food_total_usd'])/max_dollars)
        d.add(Circle(65+share(row)*8.5,y,radius,fillColor=N if i==0 else colors.HexColor('#718783'),strokeColor=None))
        home=share(row,'food_at_home_usd')*8.5;away=share(row,'food_away_from_home_usd')*8.5
        d.add(Rect(337,y-5,home,10,fillColor=T,strokeColor=None))
        d.add(Rect(337+home,y-5,away,10,fillColor=O,strokeColor=None))
    text(12,211,'Dot area = annual all-food dollars',7,M)
    d.add(Rect(285,210,6,6,fillColor=T,strokeColor=None));text(295,210,'At home',7)
    d.add(Rect(353,210,6,6,fillColor=O,strokeColor=None));text(363,210,'Away from home',7)
    arrow(257,304,271,304,'Select group',226,316)
    arrow(128,204,128,171,'Select quintile',136,186)
    arrow(401,204,401,171,'Select category + quintile',410,185)
    box(1,1,526,169)
    text(12,154,'03  LINE CHART / FOLLOW TIME',10,N,True)
    text(12,141,'2015-2024; dark line = selected group; click a dark point to choose a year',7.5,M)
    bx=34;by=28;pw=438;ph=100
    for tick in [0,5,10,15,20]:
        y=by+tick/20*ph;line(bx,y,bx+pw,y);text(bx-5,y-2,f'{tick}%',6.5,M,anchor='end')
    for year in [2015,2017,2019,2021,2024]:
        x=bx+(year-2015)/9*pw;text(x,17,str(year),6.5,M,anchor='middle')
    end_labels=[]
    for q in reversed(quintiles):
        group=sorted([r for r in records if r['income_quintile']==q],key=lambda r:int(r['year']))
        points=[]
        for r in group: points.extend([bx+(int(r['year'])-2015)/9*pw,by+share(r)/20*ph])
        d.add(PolyLine(points,strokeColor=N if q=='Lowest' else colors.HexColor('#718783'),strokeWidth=1.8 if q=='Lowest' else .8,fillColor=None))
        if q=='Lowest':
            for i in range(0,len(points),2):d.add(Circle(points[i],points[i+1],2.1,fillColor=N,strokeColor=colors.white,strokeWidth=.4))
        end_labels.append((points[-1],q))
    previous=0
    for y,q in sorted(end_labels):
        label_y=max(y,previous+9);previous=label_y
        line(bx+pw+2,y,bx+pw+7,label_y);text(bx+pw+9,label_y-2,q,6.8,N,q=='Lowest')
    line(bx+pw,by,bx+pw,by+ph,O,.7)
    text(12,5,'Choosing a year updates both upper charts; Reset restores 2024 / Lowest / All food.',7,T)
    return d

diagram=detailed_layout()
renderSVG.drawToFile(diagram,str(ROOT/'docs/prototype-layout.svg'))
story=[Spacer(1,76),p('FOOD BUDGET ATLAS','title'),p('U.S. Food Expenditures by Income Quintile','heading'),Spacer(1,18),p('Mid Submission<br/><b>Working Prototype</b>'),Spacer(1,34),p('<b>Yueli He</b><br/>Information Visualization<br/>NYU Tandon School of Engineering<br/>Fall 2026'),Spacer(1,18),p('Prepared November 9, 2026','small'),Spacer(1,40),p('Research focus','heading'),p('How much of each income group\'s expenditure budget goes to food, how is that share split between home and away, and how does the pattern change over time?'),Spacer(1,24),p('A D3.js dashboard using official BLS Consumer Expenditure Survey data, 2015-2024.','small')]
story += [PageBreak(),p('Specific views, one narrative','title'),p('Compare income groups, explain the food-category split, then examine change over time. This detailed layout replaces the earlier block-only sketch.'),diagram,Spacer(1,10)]
story.append(table([
    ['View / research question','Contribution to the narrative'],
    ['1. Which groups spend the largest share?','Dots compare budget shares; area adds dollars. A smaller dollar amount can still represent a larger budget share.'],
    ['2. How much is at home versus away?','Stacked bars separate categories using a common total-expenditure denominator. Select a segment to focus the other views.'],
    ['3. How did shares change over time?','Overlaid lines compare levels; small multiples separate overlapping groups. Optional zoom uses identical category-wide axes.'],
],[213,315]))

story += [PageBreak(),p('Data and encoding decisions','title'),p('<b>Public source:</b> U.S. Bureau of Labor Statistics, Consumer Expenditure Surveys. The frozen extract contains 50 year-by-quintile group means (2015-2024) and a 100-row tidy category table. It includes quantitative amounts/shares, ordinal income quintiles, and nominal food categories.'),p('<b>Preparation:</b> 20 BLS series were retrieved; numeric types were converted and all 50 year-quintile keys checked. No missing fields or duplicate keys were found. Home + away can differ from the published food total by up to $2 because BLS rounds dollar amounts. Shares are computed as expenditure / total expenditures x 100.'),p('Channel justification table','heading')]
story.append(table([
    ['Data variable','Data type','Mark','Channel','Principle','Justification'],
    ['Food share','Quantitative','Dot; bar; line point','X-position / length; Y-position','Effectiveness','Common scales prioritize the main measure. Away segments use length from a shifting baseline.'],
    ['Income quintile','Ordinal','Dot / bar row; line','Ordered rows / panels; labels','Expressiveness','Preserve income rank; label context lines without a five-color legend.'],
    ['Year','Temporal, ordered','Line point','X-position','Convention','Left-to-right chronological order.'],
    ['Food category','Nominal','Bar segment','Hue and segment order','Expressiveness','Two consistent hues identify home and away; order is a redundant cue.'],
    ['All-food dollars','Quantitative','Dot','Area','Expressiveness','Square-root radius makes area proportional to annual food dollars.'],
],[72,65,62,80,80,169]))
story += [p('Linked selections','heading'),p('A dot selects an income quintile; a stacked segment selects a quintile and category; a dark overlaid point selects a year; a facet point selects both group and year. Each action updates the other two views and the summary. Year/category controls and Reset provide additional routes. Details appear on hover or keyboard focus. Linked native tables, a 50-record CSV download and print output provide non-hover access. Transitions last 420 ms and respect reduced-motion settings.'),p('Design tradeoffs and limits','heading'),p('Adjacent comparison cards use proximity, matching styles use similarity, and card borders use enclosure. Dot/bar scales stay 0-20%. Facets reduce overlap but need more space. Trend zoom excludes zero and discloses magnification; all panels share a range covering all years/groups in the category. Dollar values are current, not inflation adjusted; ratios of group means do not describe every household or establish causation.','small')]

story += [PageBreak(),p('Access, evidence and next steps','title'),p('Run without installation','heading'),p('Extract the ZIP and double-click <b>Food_Budget_Atlas.html</b>. It contains the data, D3 code and styles, and runs offline in a modern browser. The included <b>source/</b> directory provides editable code and data; its README explains the Node/Vite development workflow.'),p('Repository: <link href="https://github.com/yuelihe2-svg/nyu-information-visualization-mini-project-2" color="#216d77">nyu-information-visualization-mini-project-2</link>. Repository access must be granted to the grader if it remains private. The package includes the source as an access fallback.','small'),p('Two annotated screenshots','heading'),p('<b>01-overview.png:</b> the 2024 all-food view links the main group comparison, the category split and the time series.<br/><b>02-linked-selection.png:</b> Middle / Away from home / 2020 in Small multiples + Zoom shows linked views and shared facet axes. The selected share is 4.0%, corresponding to $2,070.'),p('Response to instructor feedback','heading'),p('The proposal feedback identified vague block-only sketches and a missing dedicated cover. This brief adds a separate cover, a detailed diagram with actual data-based marks and axes, and an explicit research-question-to-view mapping. The screenshots show how those visuals work together in the implemented narrative.'),p('Verification completed','heading'),p('The portable HTML was tested offline. All 150 combinations of year, food category and income quintile match the frozen CSV. Checks passed for selection from all three views, keyboard focus and selection, tooltips, reset, animation interruption, reduced motion, and responsive widths from 320 to 1600 px. Essential marks meet 3:1 contrast on white; tables, CSV export and print output were checked. Four browser color-vision simulations were reviewed. All 12 category/layout/scale combinations and 150 facet selections were checked. Real screen-reader testing remains pending.'),p('Classroom feedback still to be collected','heading'),p('Live attendance and demonstration remain part of the prototype requirement. After the session, submit a feedback log of at most half a page: who provided feedback, the main issues, and planned changes. The preparation folder contains a blank template and rehearsal notes. It is not evidence that a session occurred.'),p('Sources and AI assistance','heading'),p('Data: <link href="https://www.bls.gov/cex/" color="#216d77">BLS Consumer Expenditure Surveys</link> and <link href="https://www.bls.gov/developers/api_signature_v2.htm" color="#216d77">BLS Public Data API</link>. Software: D3.js and Vite; Playwright for automated verification. Course references: Weeks 3-4 color/encoding; Week 5 hierarchy (PDF p. 37); Week 6 focus/context, small multiples and accessibility (pp. 6, 8-9, 15, 26, 37); Week 9 shared state (p. 37). OpenAI Codex assisted with data processing, dashboard code, diagrams, documentation and automated checks. Full provenance appears in source/docs/sources.md. No peer feedback or testing results have been invented.','small')]

def decorate(canvas,doc):
    canvas.saveState();canvas.setFillColor(M);canvas.setFont('Helvetica-Bold',8)
    canvas.drawString(42,761,'NYU TANDON / INFORMATION VISUALIZATION')
    canvas.setStrokeColor(G);canvas.line(42,43,570,43)
    canvas.setFont('Helvetica',8);canvas.drawString(42,29,'Food Budget Atlas | Working Prototype')
    canvas.drawRightString(570,29,str(doc.page));canvas.restoreState()
SimpleDocTemplate(str(PDF),pagesize=(612,792),leftMargin=42,rightMargin=42,topMargin=57,bottomMargin=57,title='Food Budget Atlas - Working Prototype',author='Yueli He').build(story,onFirstPage=decorate,onLaterPages=decorate)

# Only include explicit deliverables and tracked-style source directories, never credentials,
# node_modules, local caches, old output archives, or temporary review files.
readme='''FOOD BUDGET ATLAS - WORKING PROTOTYPE
Author: Yueli He | Information Visualization | Prepared November 9, 2026

START HERE
1. Extract this ZIP to a normal folder.
2. Open Food_Budget_Atlas.html in Microsoft Edge, Chrome or Firefox.
   No installation, account, server or internet connection is needed to use the charts.
   The optional BLS source link needs the internet. The standalone copy uses system fonts.
3. Select a dot, a food segment or a dark trend point; all views update. Reset restores the initial view.

SUBMISSION MATERIALS
- Working_Prototype_Brief.pdf: separate cover, detailed chart design, data/encoding table and evidence.
- Reflection.pdf: one-page principles, tradeoffs and current channel table; review in your own voice.
- screenshots/: the two annotated screenshots required for this prototype stage.
- Food_Budget_Atlas.html: working prototype, ready for a classroom demo or grading.
- source/: editable D3/Vite code, CSVs, provenance and setup instructions.
- verification.json and trend-verification.json: automated checks, not human testing results.

BEFORE THE PROTOTYPE SUBMISSION IS COMPLETE
Attend and demonstrate at the classroom peer-feedback session. Complete a feedback log of at most
half a page with the real people/aliases, issues and planned changes. The files in preparation/
are rehearsal notes and an unfilled template only; they must not be submitted as completed evidence.
If the portal requires a repository link, include the GitHub URL from the brief and give the grader
access if the repository remains private. The source folder is an additional access fallback.

DEVELOPMENT
In source/, install Node.js 20.19+ or 22.12+, run npm ci, then npm run dev.
Use npm run build:portable to regenerate a standalone copy under source/output/prototype/.
Detailed reproduction and verification commands are in source/README.md.

This is the mid-submission prototype package. The final two-peer usability report is still pending.
'''
archive=OUT/'Working_Prototype_Package.zip'
with ZipFile(archive,'w',ZIP_DEFLATED) as z:
    z.write(PDF,'Working_Prototype_Brief.pdf')
    z.write(OUT/'pdf/reflection.pdf','Reflection.pdf')
    z.write(OUT/'prototype/Food_Budget_Atlas.html','Food_Budget_Atlas.html')
    z.write(OUT/'prototype/verification.json','verification.json')
    z.write(OUT/'prototype/trend-verification.json','trend-verification.json')
    for file in sorted((OUT/'prototype/screenshots').glob('*.png')):z.write(file,'screenshots/'+file.name)
    z.write(ROOT/'docs/classroom-demo.txt','preparation/Classroom_Demo.txt')
    z.write(ROOT/'docs/code-walkthrough.md','preparation/Code_Walkthrough.md')
    z.write(ROOT/'docs/prototype-feedback-template.txt','preparation/Feedback_Log_TEMPLATE.txt')
    for name in ['index.html','package.json','package-lock.json','.gitignore']:
        z.write(ROOT/name,'source/'+name)
    z.writestr('source/README.md', '''# Food Budget Atlas - Development source

The ready-to-use dashboard is `../Food_Budget_Atlas.html`. Double-click it after extracting the ZIP; no installation or network connection is needed.

## Edit and run

Use Node.js 22.12+ (or Node 20.19+). In this source directory:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Data are included under `data/`; no BLS key or live request is required. If the Windows npm cache is unwritable, append `--cache .npm-cache` to `npm ci`.

## Build and verify

```sh
npm run build:portable
python scripts/check_data.py
node scripts/check_prototype.mjs
node scripts/check_trend_modes.mjs
```

The standalone output is `output/prototype/Food_Budget_Atlas.html`. Browser checks use a local Microsoft Edge installation through Playwright. The dashboard itself works in modern browsers and does not depend on Edge.

For a development server on port 4173, also run `node scripts/check_dashboard.mjs` and `node scripts/check_transitions.mjs`. Both accept a `DASHBOARD_URL` environment variable for other URLs or the standalone file.

To reproduce the submission documents after verification, run `node scripts/capture_prototype.mjs`, then `python scripts/build_reflection_pdf.py` and `python scripts/build_prototype_package.py`. The PDF builder requires ReportLab and the Windows Georgia fonts.

## Source map

- `src/main.js`: shared state, calculations, three D3 views and interaction handling.
- `src/styles.css` and `index.html`: layout, accessibility labels and responsive styling.
- `data/`: frozen BLS raw response and both CSV representations.
- [Sources and AI assistance](docs/sources.md).
- [Working prototype rubric and evidence](docs/working-prototype.md).
- [Detailed layout](docs/prototype-layout.svg).
- [Final usability protocol](docs/usability-testing.md), still awaiting real peer sessions.

Three views answer the income-comparison, category-breakdown and historical-change questions. All percentages divide by total expenditures. Dot area always represents annual all-food dollars. Values are group means in current dollars, with no causal or individual-household interpretation.
''')
    for directory in ['src','data','docs','scripts']:
        for file in sorted((ROOT/directory).rglob('*')):
            if file.is_file() and '__pycache__' not in file.parts:z.write(file,'source/'+file.relative_to(ROOT).as_posix())
    z.writestr('START_HERE.txt',readme)
assert ZipFile(archive).testzip() is None
print(PDF);print(archive)
