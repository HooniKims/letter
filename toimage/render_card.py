import argparse
import json
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

SCRIPT_DIR = Path(__file__).resolve().parent
SETTINGS_PATH = SCRIPT_DIR / "card-settings.json"
SETTINGS = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
MESSAGE_FONT_PATH = SCRIPT_DIR / SETTINGS["font"]["messageFile"]
FOOTER_FONT_PATH = SCRIPT_DIR / SETTINGS["font"]["footerFile"]


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

    layout = SETTINGS["layout"]
    panel_settings = layout["messagePanel"]
    message_settings = layout["message"]
    footer_settings = layout["footer"]

    content_left = mm_to_px(layout["contentSafeMarginMm"]["left"], args.dpi)
    content_right = args.width - mm_to_px(layout["contentSafeMarginMm"]["right"], args.dpi)
    panel_left = max(content_left, mm_to_px(panel_settings["leftMm"], args.dpi))
    panel_right = min(content_right, args.width - mm_to_px(panel_settings["rightMm"], args.dpi))
    message_max_width = min(mm_to_px(message_settings["maxWidthMm"], args.dpi), panel_right - panel_left - mm_to_px(3.0, args.dpi))
    message_max_height = mm_to_px(message_settings["maxHeightMm"], args.dpi)

    message_font = fit_message_font(draw, args.message, message_max_width, message_max_height)
    footer_font = load_font(int(footer_settings["fontPx"]), role="footer")

    lines = wrap_text(draw, args.message, message_font, message_max_width)
    line_height = int(message_font.size * float(message_settings["lineHeight"]))
    text_height = line_height * len(lines)
    panel_height = max(mm_to_px(panel_settings["minHeightMm"], args.dpi), text_height + mm_to_px(4.9, args.dpi))
    panel_y = max(mm_to_px(4.9, args.dpi), (args.height - panel_height) // 2 + mm_to_px(panel_settings["verticalOffsetMm"], args.dpi))
    panel = (panel_left, panel_y, panel_right, panel_y + panel_height)

    shadow_panel = (panel[0] + 4, panel[1] + 5, panel[2] + 4, panel[3] + 5)
    panel_radius = mm_to_px(panel_settings["cornerRadiusMm"], args.dpi)
    draw.rounded_rectangle(shadow_panel, radius=panel_radius, fill=tuple(panel_settings["shadowRgba"]))
    draw.rounded_rectangle(panel, radius=panel_radius, fill=tuple(panel_settings["fillRgba"]))
    draw.rounded_rectangle(panel, radius=panel_radius, outline=tuple(panel_settings["outlineRgba"]), width=1)

    y = panel_y + (panel_height - text_height) // 2
    for line in lines:
      bbox = draw.textbbox((0, 0), line, font=message_font)
      x = (args.width - (bbox[2] - bbox[0])) // 2
      draw.text(
          (x, y),
          line,
          font=message_font,
          fill=tuple(message_settings["fillRgba"]),
          stroke_width=int(message_settings["strokeWidthPx"]),
          stroke_fill=tuple(message_settings["strokeRgba"])
      )
      y += line_height

    footer_bbox = draw.textbbox((0, 0), args.footer, font=footer_font)
    footer_x = (args.width - (footer_bbox[2] - footer_bbox[0])) // 2
    footer_text_height = footer_bbox[3] - footer_bbox[1]
    footer_padding_x = mm_to_px(footer_settings["paddingXmm"], args.dpi)
    footer_padding_top = mm_to_px(footer_settings["paddingTopMm"], args.dpi)
    footer_padding_bottom = mm_to_px(footer_settings["paddingBottomMm"], args.dpi)
    footer_bottom = args.height - mm_to_px(footer_settings["bottomMm"], args.dpi)
    footer_y = footer_bottom - footer_padding_bottom - footer_text_height
    footer_top = footer_y - footer_padding_top
    draw.rounded_rectangle(
        (footer_x - footer_padding_x, footer_top, footer_x + (footer_bbox[2] - footer_bbox[0]) + footer_padding_x, footer_bottom),
        radius=mm_to_px(footer_settings["cornerRadiusMm"], args.dpi),
        fill=tuple(footer_settings["fillRgba"]),
        outline=tuple(footer_settings["outlineRgba"]),
        width=1
    )
    draw.text(
        (footer_x, footer_y),
        args.footer,
        font=footer_font,
        fill=tuple(footer_settings["textRgba"])
    )

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    card.save(args.output, "PNG", dpi=(args.dpi, args.dpi))


def fit_message_font(draw, text, max_width, max_height):
    message_settings = SETTINGS["layout"]["message"]
    for size in range(int(message_settings["fontMaxPx"]), int(message_settings["fontMinPx"]) - 1, -2):
        font = load_font(size, role="message")
        lines = wrap_text(draw, text, font, max_width)
        height = int(font.size * float(message_settings["lineHeight"])) * len(lines)
        if len(lines) <= int(message_settings["maxLines"]) and height <= max_height:
            return font
    return load_font(int(message_settings["fontMinPx"]), role="message")


def wrap_text(draw, text, font, max_width):
    normalized = " ".join(str(text).split())
    words = normalized.split(" ")
    if not words:
        return []

    max_lines = int(SETTINGS["layout"]["message"]["maxLines"])
    best = None
    for line_count in range(1, max_lines + 1):
        candidate = best_korean_lines(draw, words, font, max_width, line_count)
        if candidate and (best is None or candidate["score"] < best["score"]):
            best = candidate

    if best:
        return best["lines"]

    return split_long_lines(draw, [normalized], font, max_width)


def best_korean_lines(draw, words, font, max_width, line_count):
    n = len(words)
    memo = {}

    def solve(start, remaining):
        key = (start, remaining)
        if key in memo:
            return memo[key]
        if remaining == 1:
            line = " ".join(words[start:])
            if text_width(draw, line, font) > max_width:
                memo[key] = None
                return None
            score = line_score(draw, line, "", font, max_width, is_last=True)
            memo[key] = (score, [line])
            return memo[key]

        best = None
        min_next_words = remaining - 1
        for end in range(start + 1, n - min_next_words + 1):
            line = " ".join(words[start:end])
            if text_width(draw, line, font) > max_width:
                break
            next_word = words[end] if end < n else ""
            rest = solve(end, remaining - 1)
            if rest is None:
                continue
            score = line_score(draw, line, next_word, font, max_width, is_last=False) + rest[0]
            if best is None or score < best[0]:
                best = (score, [line] + rest[1])

        memo[key] = best
        return best

    result = solve(0, line_count)
    if not result:
        return None

    lines = result[1]
    if line_count > 1 and any(is_too_short_line(line) for line in lines):
        return None
    return {"score": result[0] + line_count_penalty(lines), "lines": lines}


def line_score(draw, line, next_word, font, max_width, is_last):
    width = text_width(draw, line, font)
    fullness = width / max_width
    score = abs(0.82 - fullness) * 42
    if fullness < 0.54:
        score += 28

    if not is_last:
        if has_internal_sentence_break(line):
            score += 34
        if ends_sentence(line):
            score -= 54
        elif ends_soft_break(line):
            score -= 7
        else:
            score += 4

    last_word = line.split(" ")[-1]
    if SETTINGS["koreanLineBreak"]["avoidSingleSyllableEdges"]:
        if korean_len(last_word) <= 1:
            score += 36
        if next_word and korean_len(next_word) <= 1:
            score += 24
        if last_word.endswith("의"):
            score += 18
    if next_word and is_auxiliary_followup(next_word):
        score += 42
    if SETTINGS["koreanLineBreak"]["avoidLineStartPunctuation"] and next_word and re.match(r"^[,.;:!?)]", next_word):
        score += 50
    return score


def line_count_penalty(lines):
    if not SETTINGS["koreanLineBreak"]["balanceLines"] or len(lines) <= 1:
        return 0
    lengths = [len(strip_marks(line)) for line in lines]
    average = sum(lengths) / len(lengths)
    return sum((length - average) ** 2 for length in lengths) * 0.3


def is_too_short_line(line):
    return len(strip_marks(line)) <= 6


def ends_sentence(line):
    return bool(re.search(r"(다|요|죠|게요|어요|해요|니다)[.!?。]*$", line))


def has_internal_sentence_break(line):
    return bool(re.search(r"(다|요|죠|게요|어요|해요|니다)[.!?。]+\s+\S", line))


def is_auxiliary_followup(word):
    return bool(re.match(r"^(주셔서|주신|주세요|주시고|주시는|주셔요|주셨|드릴게요|드리고|드리겠습니다)", word))


def ends_soft_break(line):
    return bool(re.search(r"[,，、;；:]$", line))


def strip_marks(text):
    return re.sub(r"[\s,.!?，。、;；:]", "", text)


def korean_len(text):
    return len(strip_marks(text))


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


def mm_to_px(value, dpi):
    return int(round((float(value) / 25.4) * dpi))


def load_font(size, role):
    font_path = MESSAGE_FONT_PATH if role == "message" else FOOTER_FONT_PATH
    if not font_path.exists():
        raise FileNotFoundError(f"Paperlogy font file is missing: {font_path}")
    return ImageFont.truetype(str(font_path), size)


if __name__ == "__main__":
    main()
