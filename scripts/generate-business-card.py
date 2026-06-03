#!/usr/bin/env python3
"""
Carte de visite Maxime Farineau — PDF VistaPrint (format EU).
Dimensions : fond perdu 88 × 58 mm · fini 85 × 55 mm · 300 DPI équivalent.
Usage : python3 scripts/generate-business-card.py
"""

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
LOGO = ROOT / "assets" / "logo.png"
OUT = ROOT / "print" / "maxime-farineau-carte-visite-vistaprint.pdf"

# VistaPrint EU (France)
BLEED_W = 88 * mm
BLEED_H = 58 * mm
TRIM_W = 85 * mm
TRIM_H = 55 * mm
OFF_X = (BLEED_W - TRIM_W) / 2
OFF_Y = (BLEED_H - TRIM_H) / 2
SAFE = 3.5 * mm

BLACK = HexColor("#000000")
GREEN = HexColor("#6ED888")
WHITE = HexColor("#F0EDE6")
MUTED = HexColor("#666666")
DIM = HexColor("#333333")
GRID = HexColor("#1A1A1A")

NAME = "MAXIME FARINEAU"
ROLE = "Développeur Web Full Stack"
SITE = "maximefarineau.com"
LOC = "Biarritz, France"


def trim_rect():
    return (OFF_X, OFF_Y, OFF_X + TRIM_W, OFF_Y + TRIM_H)


def safe_rect():
    x0, y0, x1, y1 = trim_rect()
    return (x0 + SAFE, y0 + SAFE, x1 - SAFE, y1 - SAFE)


def draw_bg(c):
    c.setFillColor(BLACK)
    c.rect(0, 0, BLEED_W, BLEED_H, fill=1, stroke=0)

    x0, y0, x1, y1 = trim_rect()
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2
    c.saveState()
    c.setFillColor(HexColor("#0A120E"))
    c.circle(cx, cy, 42 * mm, fill=1, stroke=0)
    c.setFillColor(HexColor("#061008"))
    c.setFillAlpha(0.85)
    c.circle(cx, cy + 8 * mm, 28 * mm, fill=1, stroke=0)
    c.restoreState()

    c.saveState()
    c.setStrokeColor(GRID)
    c.setLineWidth(0.15)
    step = 4 * mm
    sx0, sy0, sx1, sy1 = safe_rect()
    y = sy0
    while y <= sy1:
        c.line(sx0, y, sx1, y)
        y += step
    x = sx0
    while x <= sx1:
        c.line(x, sy0, x, sy1)
        x += step
    c.restoreState()


def draw_brackets(c):
    x0, y0, x1, y1 = safe_rect()
    pad = 2 * mm
    size = 5 * mm
    c.setStrokeColor(HexColor("#FFFFFF"))
    c.setStrokeAlpha(0.18)
    c.setLineWidth(0.4)
    pairs = [
        (x0 + pad, y1 - pad, 1, -1),
        (x1 - pad, y1 - pad, -1, -1),
        (x0 + pad, y0 + pad, 1, 1),
        (x1 - pad, y0 + pad, -1, 1),
    ]
    for ox, oy, dx, dy in pairs:
        c.line(ox, oy, ox + dx * size, oy)
        c.line(ox, oy, ox, oy + dy * size)


def draw_top_bar(c, left_label, right_label):
    x0, y0, x1, y1 = safe_rect()
    y = y1 - 5.5 * mm
    c.setFont("Courier", 5)
    c.setFillColor(MUTED)
    c.drawString(x0, y, left_label)
    tw = c.stringWidth(right_label, "Courier", 5)
    c.setFillColor(GREEN)
    c.drawString(x1 - tw, y, right_label)


def draw_bottom_bar(c, text):
    x0, y0, x1, y1 = safe_rect()
    c.setFont("Courier", 4.5)
    c.setFillColor(DIM)
    tw = c.stringWidth(text, "Courier", 4.5)
    c.drawString((x0 + x1 - tw) / 2, y0 + 3 * mm, text)


def draw_front(c):
    draw_bg(c)
    draw_brackets(c)
    draw_top_bar(c, "// CONTACT_CARD", "SYS_01 · LINK:OK")

    x0, y0, x1, y1 = safe_rect()
    cx = (x0 + x1) / 2

    if LOGO.exists():
        logo_size = 22 * mm
        c.drawImage(
            str(LOGO),
            cx - logo_size / 2,
            y0 + 24 * mm,
            logo_size,
            logo_size,
            mask="auto",
            preserveAspectRatio=True,
        )

    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(WHITE)
    name_w = c.stringWidth(NAME, "Helvetica-Bold", 11)
    c.drawString(cx - name_w / 2, y0 + 19 * mm, NAME)

    c.setFont("Courier", 6)
    c.setFillColor(MUTED)
    role_w = c.stringWidth(ROLE, "Courier", 6)
    c.drawString(cx - role_w / 2, y0 + 15.5 * mm, ROLE)

    c.setFont("Courier-Bold", 7)
    c.setFillColor(GREEN)
    site_w = c.stringWidth(SITE, "Courier-Bold", 7)
    c.drawString(cx - site_w / 2, y0 + 12 * mm, SITE)

    draw_bottom_bar(c, f"{LOC}  ·  ● DISPONIBLE")


def draw_back(c):
    draw_bg(c)
    draw_brackets(c)
    draw_top_bar(c, "// SCAN_PORTFOLIO", "VERSO · QR")

    x0, y0, x1, y1 = safe_rect()
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2

    qr_size = 28 * mm
    qx = cx - qr_size / 2
    qy = cy - qr_size / 2 + 2 * mm

    c.setStrokeColor(HexColor("#FFFFFF"))
    c.setStrokeAlpha(0.12)
    c.setLineWidth(0.5)
    c.setDash([2, 2])
    c.rect(qx, qy, qr_size, qr_size, fill=0, stroke=1)
    c.setDash()

    c.setFont("Courier", 5)
    c.setFillColor(MUTED)
    label = "QR CODE"
    lw = c.stringWidth(label, "Courier", 5)
    c.drawString(cx - lw / 2, cy - 1.5 * mm, label)

    hint = "À placer ici"
    hw = c.stringWidth(hint, "Courier", 4.5)
    c.setFont("Courier", 4.5)
    c.setFillColor(DIM)
    c.drawString(cx - hw / 2, cy - 4.5 * mm, hint)

    c.setFont("Courier", 5.5)
    c.setFillColor(WHITE)
    site = SITE.upper()
    sw = c.stringWidth(site, "Courier", 5.5)
    c.drawString(cx - sw / 2, y0 + 11 * mm, site)

    draw_bottom_bar(c, "> open_url · portfolio")


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=(BLEED_W, BLEED_H))
    c.setTitle("Maxime Farineau — Carte de visite")
    c.setAuthor("Maxime Farineau")

    draw_front(c)
    c.showPage()
    draw_back(c)
    c.showPage()

    c.save()
    print(f"PDF créé : {OUT}")
    print("Format : 88 × 58 mm (fond perdu EU) · 2 pages (recto + verso)")
    print("VistaPrint : téléverser en « votre propre design », format carte standard EU.")


if __name__ == "__main__":
    main()
