import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

SCRIPT_DIR = Path(__file__).resolve().parent
FONT_DIR = SCRIPT_DIR / "fonts"
MESSAGE_FONT_PATH = FONT_DIR / "Paperlogy-7Bold.ttf"
FOOTER_FONT_PATH = FONT_DIR / "Paperlogy-6SemiBold.ttf"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--background", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--message", required=True)
    parser.add_argument("--footer", required=True)
    parser.add_argument("--width", type=int, required=True)
    parser.add_argument("--height", type=int, required=True)
    parser.add_argument("--dpi", type=int, required=True)
    args = parser.parse_args()

    background = Image.open(args.background).convert("RGB")
    card = ImageOps.fit(background, (args.width, args.height), method=Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(card, "RGBA")

    message_font = fit_message_font(draw, args.message, args.width - 120, 192)
    footer_font = load_font(27, role="footer")

    lines = wrap_text(draw, args.message, message_font, args.width - 360)
    line_height = int(message_font.size * 1.45)
    text_height = line_height * len(lines)
    panel_height = max(184, text_height + 64)
    panel_y = max(52, (args.height - panel_height) // 2 - 6)
    panel = (176, panel_y, args.width - 176, panel_y + panel_height)

    shadow_panel = (panel[0] + 4, panel[1] + 5, panel[2] + 4, panel[3] + 5)
    draw.rounded_rectangle(shadow_panel, radius=30, fill=(88, 37, 45, 42))
    draw.rounded_rectangle(panel, radius=30, fill=(255, 250, 244, 226))
    draw.rounded_rectangle(panel, radius=30, outline=(150, 58, 76, 70), width=2)

    y = panel_y + (panel_height - text_height) // 2
    for line in lines:
      bbox = draw.textbbox((0, 0), line, font=message_font)
      x = (args.width - (bbox[2] - bbox[0])) // 2
      draw.text(
          (x, y),
          line,
          font=message_font,
          fill=(91, 33, 47, 255),
          stroke_width=3,
          stroke_fill=(255, 255, 255, 238)
      )
      y += line_height

    footer_bbox = draw.textbbox((0, 0), args.footer, font=footer_font)
    footer_x = (args.width - (footer_bbox[2] - footer_bbox[0])) // 2
    footer_y = args.height - 48
    draw.rounded_rectangle(
        (footer_x - 24, footer_y - 7, footer_x + (footer_bbox[2] - footer_bbox[0]) + 24, footer_y + 34),
        radius=20,
        fill=(255, 255, 255, 218),
        outline=(150, 58, 76, 58),
        width=1
    )
    draw.text(
        (footer_x, footer_y),
        args.footer,
        font=footer_font,
        fill=(91, 33, 47, 255),
        stroke_width=1,
        stroke_fill=(255, 255, 255, 220)
    )

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    card.save(args.output, "PNG", dpi=(args.dpi, args.dpi))


def fit_message_font(draw, text, max_width, max_height):
    for size in range(48, 25, -2):
        font = load_font(size, role="message")
        lines = wrap_text(draw, text, font, max_width)
        height = int(font.size * 1.45) * len(lines)
        if len(lines) <= 3 and height <= max_height:
            return font
    return load_font(26, role="message")


def wrap_text(draw, text, font, max_width):
    normalized = " ".join(str(text).split())
    words = normalized.split(" ")
    lines = []
    current = ""

    for word in words:
        candidate = word if not current else f"{current} {word}"
        if text_width(draw, candidate, font) <= max_width:
            current = candidate
            continue

        if current:
            lines.append(current)
        current = word

    if current:
        lines.append(current)

    return split_long_lines(draw, lines, font, max_width)


def split_long_lines(draw, lines, font, max_width):
    result = []
    for line in lines:
        if text_width(draw, line, font) <= max_width:
            result.append(line)
            continue

        current = ""
        for char in line:
            candidate = current + char
            if text_width(draw, candidate, font) <= max_width:
                current = candidate
            else:
                if current:
                    result.append(current)
                current = char
        if current:
            result.append(current)
    return result


def text_width(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0]


def load_font(size, role):
    font_path = MESSAGE_FONT_PATH if role == "message" else FOOTER_FONT_PATH
    if not font_path.exists():
        raise FileNotFoundError(f"Paperlogy font file is missing: {font_path}")
    return ImageFont.truetype(str(font_path), size)


if __name__ == "__main__":
    main()
