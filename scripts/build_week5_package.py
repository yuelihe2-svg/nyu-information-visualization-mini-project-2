"""Build the English Week 5 proposal and optional supporting-data ZIP."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output' / 'pdf' / 'week5-proposal.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Georgia', r'C:\Windows\Fonts\georgia.ttf'))
pdfmetrics.registerFont(TTFont('Georgia-Bold', r'C:\Windows\Fonts\georgiab.ttf'))
pdfmetrics.registerFontFamily('Georgia', normal='Georgia', bold='Georgia-Bold')
NAVY = colors.HexColor('#17333a')
TEAL = colors.HexColor('#216d77')
PALE = colors.HexColor('#eef2ef')
MUTED = colors.HexColor('#536a64')
styles = {
    'title': ParagraphStyle('title', fontName='Georgia', fontSize=25, leading=29, textColor=NAVY, spaceAfter=12),
    'subtitle': ParagraphStyle('subtitle', fontName='Helvetica', fontSize=11, leading=16, textColor=MUTED, spaceAfter=18),
    'heading': ParagraphStyle('heading', fontName='Georgia-Bold', fontSize=12, leading=16, textColor=NAVY, spaceBefore=12, spaceAfter=7),
    'body': ParagraphStyle('body', fontName='Helvetica', fontSize=10, leading=14.5, textColor=NAVY, spaceAfter=9),
    'small': ParagraphStyle('small', fontName='Helvetica', fontSize=8.5, leading=12, textColor=MUTED, spaceAfter=7),
    'cell': ParagraphStyle('cell', fontName='Helvetica', fontSize=8.2, leading=11, textColor=NAVY),
    'th': ParagraphStyle('th', fontName='Helvetica-Bold', fontSize=8.2, leading=11, textColor=colors.white),
}

def p(text, style='body'):
    return Paragraph(text, styles[style])

def table(rows, widths):
    result = Table([[p(cell, 'th' if i == 0 else 'cell') for cell in row] for i, row in enumerate(rows)], colWidths=widths, repeatRows=1)
    result.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [PALE, colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 7), ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    return result

def wireframe(option):
    drawing = Drawing(205, 144)
    drawing.add(Rect(1, 1, 202, 140, fillColor=colors.white, strokeColor=TEAL if option == 'B' else colors.HexColor('#cdd7d1'), strokeWidth=2 if option == 'B' else 1))
    def box(x, y, w, h, label, dark=False):
        drawing.add(Rect(x, y, w, h, fillColor=NAVY if dark else PALE, strokeColor=colors.HexColor('#cdd7d1'), strokeWidth=.5))
        drawing.add(String(x + w/2, y + h/2 - 3, label, fontName='Helvetica', fontSize=8, fillColor=colors.white if dark else NAVY, textAnchor='middle'))
    box(10, 110, 184, 23, 'Summary + selection', option == 'B')
    if option == 'A':
        for x, label in [(10, 'Compare'), (73, 'Breakdown'), (136, 'Trend')]:
            box(x, 12, 58, 90, label)
    elif option == 'B':
        box(10, 62, 88, 40, 'Compare'); box(106, 62, 88, 40, 'Breakdown')
        box(10, 12, 184, 42, 'Full-width trend')
    else:
        box(10, 60, 184, 42, 'Full-width trend')
        box(10, 12, 88, 40, 'Compare'); box(106, 12, 88, 40, 'Breakdown')
    return drawing

story = [p('Food Budget Atlas', 'title'), p('Week 5 Proposal + Layout Sketches<br/>Mini-Project 2 | Information Visualization', 'subtitle')]
story += [p('Dataset and scope', 'heading'), p('How much of each income group\'s annual expenditure budget goes to food, and how does that share split between food at home and food away from home? This project connects food spending with household budgets through a descriptive comparison.')]
story += [p('<b>Source:</b> U.S. Bureau of Labor Statistics (BLS), Consumer Expenditure Surveys, accessed through the public API on October 8, 2026. The extract covers <b>2015-2024</b> and five quintiles of income before taxes. Each observation is a group mean per consumer unit, not an individual household record.')]
story += [p('<b>Extract:</b> 50 year-by-quintile records in the wide CSV; 100 records in the tidy category CSV (10 years x 5 quintiles x 2 food categories). The frozen extract has no blank fields or duplicate observation keys. The dashboard uses D3.js.')]
story.append(table([
    ['Dimension', 'Data type', 'Example / interpretation'],
    ['Food expenditure share', 'Quantitative', 'Food spending / total expenditures x 100'],
    ['Income quintile', 'Ordinal', 'Lowest, Second, Middle, Fourth, Highest'],
    ['Year', 'Temporal, ordered', '2015 through 2024'],
    ['Food category', 'Nominal', 'At home; away from home'],
    ['Annual food expenditure', 'Quantitative', 'Current USD per consumer unit'],
], [150, 111, 267]))
story.append(p('Three research questions', 'heading'))
for number, text in enumerate([
    'In a selected year, how does food\'s share of total expenditures compare across the five income quintiles?',
    'How much of that share comes from food at home versus food away from home for each quintile?',
    'How did these shares change from 2015 to 2024, including the visible change around 2020?',
], 1):
    story.append(p(f'<b>{number}.</b> {text}'))
story.append(p('<b>Interpretation:</b> Shares are ratios of group means. Dollar values are not inflation adjusted. These data describe patterns; they do not measure food insecurity or establish causes.', 'small'))

story += [PageBreak(), p('Three layout options', 'title'), p('The same three coordinated views, arranged to support different reading orders.', 'subtitle')]
options = [
    ('A', 'Equal columns', 'Compare, breakdown, and trend receive equal space.', 'Simple visual balance, but the ten-year trend becomes narrow and harder to read.'),
    ('B', 'Compare, then trend', 'Proposed layout: compare and breakdown sit side by side, with the trend across the full row below.', 'Prioritizes the central group comparison and gives the time axis enough width; requires more vertical scrolling.'),
    ('C', 'Trend first', 'A full-width trend appears above the two group-comparison views.', 'Makes change over time prominent, but delays the main income-group comparison.'),
]
for key, name, description, tradeoff in options:
    block = Table([[wireframe(key), [p(f'{key}. {name}', 'heading'), p(description), p(f'<b>Tradeoff:</b> {tradeoff}', 'small')]]], colWidths=[222, 306])
    block.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 0), ('RIGHTPADDING', (0,0), (-1,-1), 8)]))
    story += [block, Spacer(1, 17)]
story += [p('Gestalt organization', 'heading'), p('<b>Proximity:</b> the two year-specific views sit together. <b>Similarity:</b> matching typography, spacing, and scales establish relationships. <b>Enclosure:</b> separate cards organize each view, while the summary establishes a clear visual hierarchy.')]

story += [PageBreak(), p('Visual encoding and interaction', 'title'), p('Channel justification table', 'heading')]
story.append(table([
    ['Data variable', 'Data type', 'Mark', 'Channel', 'Principle', 'Justification'],
    ['Food share (%)', 'Quantitative', 'Dot; bar segment; line point', 'X-position / length; Y-position', 'Effectiveness', 'Primary quantity uses common scales. Away segments use length from a shifting baseline.'],
    ['Income quintile', 'Ordinal', 'Dot / bar row; line', 'Ordered Y-position; direct labels', 'Expressiveness', 'Rows preserve income rank; labels identify the time series.'],
    ['Year', 'Temporal, ordered', 'Line point', 'X-position', 'Convention', 'Left-to-right ordering conveys chronology.'],
    ['Food category', 'Nominal', 'Bar segment', 'Hue; segment order', 'Expressiveness', 'Teal and orange identify categories. Order provides a redundant cue.'],
    ['All-food spending (USD)', 'Quantitative', 'Dot', 'Area', 'Expressiveness', 'Secondary magnitude; square-root radius makes area proportional to dollars.'],
], [74, 66, 69, 81, 77, 161]))
story.append(p('Coordinated-view plan', 'heading'))
story.append(p('<b>Compare:</b> selecting a dot focuses its income quintile in the breakdown and trend.<br/><b>Break down:</b> selecting a segment sets the quintile and food category in the other views.<br/><b>Follow time:</b> selecting a year on the focused line updates both year-specific views.'))
story.append(p('All selections update the summary. Tooltips provide exact shares and dollar amounts; Reset restores the initial view. Only the focused trend line has active year targets to avoid overlapping targets.'))
story.append(p('Perceptual choices and tradeoffs', 'heading'))
story.append(p('Fixed 0-20% axes preserve comparability but reduce the visible detail of small changes. A two-item category legend and direct line labels limit legend search. Teal/orange colors, luminance differences, and segment order support grayscale reading. Gestalt grouping and position-based comparison follow the Week 3 color and Week 4 visual-encoding lectures.'))
story.append(p('Sources and assistance', 'heading'))
story.append(p('BLS Consumer Expenditure Surveys: <link href="https://www.bls.gov/cex/" color="#216d77">bls.gov/cex</link><br/>BLS Public Data API: <link href="https://www.bls.gov/developers/api_signature_v2.htm" color="#216d77">API documentation</link><br/>Series pattern: CXU{ITEM}LB01{QUINTILE}M; items TOTALEXP, FOODTOTL, FOODHOME, FOODAWAY; quintile codes 02-06. Full provenance is included in the supporting sources document.', 'small'))
story.append(p('AI assistance: OpenAI Codex assisted with data preparation, dashboard code, layout wireframes, and proposal drafting. No peer-test results are claimed.', 'small'))

def decorate(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(MUTED); canvas.setFont('Helvetica-Bold', 8)
    canvas.drawString(42, 761, 'NYU TANDON / INFORMATION VISUALIZATION')
    canvas.setStrokeColor(colors.HexColor('#d8dfda')); canvas.line(42, 43, 570, 43)
    canvas.setFont('Helvetica', 8); canvas.drawString(42, 29, 'Food Budget Atlas | Week 5 Proposal')
    canvas.drawRightString(570, 29, str(doc.page)); canvas.restoreState()

SimpleDocTemplate(str(OUT), pagesize=(612, 792), leftMargin=42, rightMargin=42, topMargin=57, bottomMargin=57).build(story, onFirstPage=decorate, onLaterPages=decorate)
archive = ROOT / 'output' / 'Week5_Submission.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED) as z:
    for path, name in [(OUT, 'Week5_Proposal.pdf')] + [(ROOT/relative, f'supporting/{relative}') for relative in ['docs/sketches.svg', 'docs/sources.md', 'data/food_spending.csv', 'data/food_spending_long.csv', 'data/bls_api_2015_2024.json', 'scripts/fetch_data.py']]:
        z.write(path, name)
    z.writestr('READ_ME.txt', 'WEEK 5 SUBMISSION - FOOD BUDGET ATLAS\n\nThe primary document is Week5_Proposal.pdf. It contains the dataset selection, three research questions, three layout sketches, and the six-column channel justification table.\n\nThe supporting folder contains the CSV extracts, an editable SVG of the three layouts, and source / AI-assistance documentation. These supporting files are optional unless the instructor requests them.\n\nThis package covers Week 5 only. It does not claim completion of peer testing, the Week 7 classroom feedback session, or the Week 8 final submission.\n')
print(OUT)
print(archive)
