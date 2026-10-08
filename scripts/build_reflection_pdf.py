"""Render the one-page reflection draft as a polished PDF."""

from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import simpleSplit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "reflection.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

pdfmetrics.registerFont(TTFont("Georgia", r"C:\Windows\Fonts\georgia.ttf"))
pdfmetrics.registerFont(TTFont("Georgia-Bold", r"C:\Windows\Fonts\georgiab.ttf"))
pdfmetrics.registerFontFamily("Georgia", normal="Georgia", bold="Georgia-Bold")

navy = colors.HexColor("#17333a")
muted = colors.HexColor("#5f7772")
accent = colors.HexColor("#c66f3e")

source = (ROOT / "docs" / "reflection.md").read_text(encoding="utf-8")
paragraphs = [part.strip() for part in source.split("\n\n") if part.strip()]
title = paragraphs[0].removeprefix("# ")
body = [part for part in paragraphs[2:]]  # skip the draft-status line

def markup(text: str) -> str:
    text = text.replace("–", "-").replace("—", "-").replace("×", "x")
    text = re.sub(r"\*\*(.*?)\*\*", r"<b>\1</b>", text)
    return text

styles = {
    "title": ParagraphStyle("title", fontName="Georgia", fontSize=20, leading=24, textColor=navy, spaceAfter=16),
    "body": ParagraphStyle("body", fontName="Georgia", fontSize=9.6, leading=14.6, textColor=navy, spaceAfter=12, alignment=TA_LEFT),
    "note": ParagraphStyle("note", fontName="Georgia", fontSize=9, leading=13.5, textColor=muted, spaceBefore=5),
}

story = [Paragraph(title, styles["title"])]
for i, paragraph in enumerate(body):
    style = styles["note"] if paragraph.startswith("**Interpretive limit:") else styles["body"]
    story.append(Paragraph(markup(paragraph), style))

def decorate(canvas, doc):
    canvas.saveState()
    width, height = doc.pagesize
    canvas.setFillColor(accent)
    canvas.rect(47, height - 45, 42, 4, fill=1, stroke=0)
    canvas.setFont("Georgia-Bold", 8)
    canvas.setFillColor(muted)
    canvas.drawString(47, height - 30, "NYU TANDON  /  INFORMATION VISUALIZATION")
    canvas.setStrokeColor(colors.HexColor("#d8dfda"))
    canvas.line(47, 47, width - 47, 47)
    canvas.setFont("Georgia", 8)
    canvas.drawString(47, 32, "Food Budget Atlas · Reflection draft for student review")
    canvas.drawRightString(width - 47, 32, str(doc.page))
    canvas.restoreState()

doc = SimpleDocTemplate(str(OUTPUT), pagesize=(612, 792),
    leftMargin=47, rightMargin=47, topMargin=74, bottomMargin=63)
doc.build(story, onFirstPage=decorate, onLaterPages=decorate)
print(OUTPUT)
