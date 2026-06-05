#!/usr/bin/env python3
"""Génère les favicons MF — fond noir, coins arrondis (style app icon)."""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = ASSETS / "apple-touch-icon.png"
if not SOURCE.exists():
    SOURCE = ASSETS / "favicon-32x32.png"

# Rayon proche du squircle iOS
CORNER_RATIO = 0.26
BG = (10, 10, 10, 255)  # #0A0A0A — fond site


def rounded_mask(size: int) -> Image.Image:
    radius = max(2, round(size * CORNER_RATIO))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def make_icon(size: int) -> Image.Image:
    src = Image.open(SOURCE).convert("RGBA")
    src = src.resize((size, size), Image.Resampling.LANCZOS)

    # Fond noir arrondi (coins transparents = style app icon)
    mask = rounded_mask(size)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(Image.new("RGBA", (size, size), BG), (0, 0), mask)

    # Logo légèrement inset pour laisser respirer le bord arrondi
    inset = max(1, round(size * 0.08))
    inner = size - inset * 2
    logo = src.resize((inner, inner), Image.Resampling.LANCZOS)
    canvas.paste(logo, (inset, inset), logo)

    # Découpe finale squircle
    alpha = canvas.split()[3]
    canvas.putalpha(Image.composite(alpha, Image.new("L", (size, size), 0), mask))
    return canvas


def main() -> None:
    sizes = {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "apple-touch-icon.png": 180,
    }

    icons = {s: make_icon(s) for s in sizes.values()}

    for name, size in sizes.items():
        path = ASSETS / name
        icons[size].save(path, format="PNG", optimize=True)
        print(f"✓ {path.name} ({size}×{size})")

    ico_path = ASSETS / "favicon.ico"
    icons[16].save(
        ico_path,
        format="ICO",
        sizes=[(16, 16), (32, 32)],
        append_images=[icons[32]],
    )
    print(f"✓ {ico_path.name}")


if __name__ == "__main__":
    main()
