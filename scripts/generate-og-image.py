#!/usr/bin/env python3
"""Image Open Graph 1200×630 pour partages sociaux et SEO."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
LOGO = ASSETS / "logo.png"
OUT = ASSETS / "og-cover.jpg"

W, H = 1200, 630
BG = (10, 10, 10)
ACCENT = (201, 185, 154)
TEXT = (240, 237, 230)
MUTED = (136, 136, 128)


def main():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    draw.rectangle((0, H - 6, W, H), fill=ACCENT)

    if LOGO.exists():
        logo = Image.open(LOGO).convert("RGBA")
        size = 140
        logo = logo.resize((size, size), Image.Resampling.LANCZOS)
        img.paste(logo, (80, (H - size) // 2 - 20), logo)

    try:
        title_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 64)
        sub_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 30)
        tag_font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Courier New.ttf", 22)
    except OSError:
        title_font = ImageFont.load_default()
        sub_font = title_font
        tag_font = title_font

    draw.text((260, 220), "Maxime Farineau", font=title_font, fill=TEXT)
    draw.text((260, 300), "Développeur Web Full Stack", font=sub_font, fill=ACCENT)
    draw.text((260, 360), "Biarritz · Sites vitrine · E-commerce · Apps web", font=sub_font, fill=MUTED)
    draw.text((80, H - 52), "// maximefarineau.com", font=tag_font, fill=ACCENT)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "JPEG", quality=88, optimize=True)
    print(f"✓ {OUT}")


if __name__ == "__main__":
    main()
