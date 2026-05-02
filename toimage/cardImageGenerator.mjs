import { readFileSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const TOIMAGE_DIR = dirname(fileURLToPath(import.meta.url));
export const SETTINGS_PATH = join(TOIMAGE_DIR, "card-settings.json");
export const CARD_SETTINGS = JSON.parse(readFileSync(SETTINGS_PATH, "utf8"));
export const CARD_WIDTH_MM = Number(CARD_SETTINGS.print.widthMm);
export const CARD_HEIGHT_MM = Number(CARD_SETTINGS.print.heightMm);
export const CARD_DPI = Number(CARD_SETTINGS.print.dpi);
export const CARD_IMAGE_WIDTH = Math.round((CARD_WIDTH_MM / 25.4) * CARD_DPI);
export const CARD_IMAGE_HEIGHT = Math.round((CARD_HEIGHT_MM / 25.4) * CARD_DPI);
export const REQUIRED_ASPECT_RATIO = CARD_IMAGE_WIDTH / CARD_IMAGE_HEIGHT;
export const DEFAULT_INPUT_CSV = join(TOIMAGE_DIR, CARD_SETTINGS.paths.inputCsv);
export const DEFAULT_OUTPUT_DIR = join(TOIMAGE_DIR, CARD_SETTINGS.paths.outputDir);
export const DEFAULT_BACKGROUND_DIR = join(TOIMAGE_DIR, CARD_SETTINGS.paths.backgroundDir);

const BACKGROUND_STYLES = [
  "minimal warm ivory sticker card, soft scalloped edge, clean center, small watercolor carnation bouquets at both side edges",
  "minimal cream rounded label, sparse carnations in opposite corners, thin coral ribbon stroke, very few petals and hearts",
  "airy ivory card with faint blush edge wash, one side bouquet and one refined carnation sprig, lots of negative space",
  "simple Korean stationery sticker style, pale cream center, delicate side carnations, muted green leaves, no dense pattern",
  "modern minimal floral card, two light carnation clusters near the edges, subtle shadow, calm blank center"
];

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === "\"" && next === "\"") {
        cell += "\"";
        index += 1;
      } else if (char === "\"") {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === "\"") {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

export function parseStudentRows(rows) {
  return rows
    .filter((row, index) => !(index === 0 && isHeaderRow(row)))
    .map((row) => ({
      studentId: String(row[0] || "").trim(),
      studentName: String(row[1] || "").trim(),
      message: String(row[2] || "").trim()
    }))
    .filter((row) => row.studentId && row.studentName && row.message);
}

export function buildCardBackgroundPrompt(row, index = 0) {
  const style = BACKGROUND_STYLES[index % BACKGROUND_STYLES.length];
  return [
    "Create a full-bleed horizontal Korean Parents' Day greeting card background.",
    `Visual direction: ${style}.`,
    "Use the mood of the local sample.png reference: clean cream sticker card, soft scalloped edge, gentle carnations on the sides, modern minimal Korean stationery.",
    "No text, no letters, no numbers, no signature, no logo, no watermark.",
    "No border, no frame, no outer margin; artwork must fill the entire canvas edge to edge.",
    "Leave a softly calm central area suitable for adding a two-sentence Korean message later.",
    "Keep the lower center area visually clean enough for a small student id and name footer.",
    "Use a refined, warm, family-friendly style for middle school students; avoid ornate, vintage, old-fashioned, or busy illustration styles."
  ].join(" ");
}

export function safeFileStem(studentId, studentName) {
  return `${studentId}_${studentName}`
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export async function readStudentCsv(inputPath) {
  const text = await readFile(inputPath, "utf8");
  return parseStudentRows(parseCsv(text));
}

export async function generateCards(options = {}) {
  const inputPath = resolve(options.input || DEFAULT_INPUT_CSV);
  const outputDir = resolve(options.out || DEFAULT_OUTPUT_DIR);
  const backgroundDir = resolve(options.backgroundDir || DEFAULT_BACKGROUND_DIR);
  const limit = Number(options.limit || 3);
  const backgroundFiles = options.localPreview ? [] : await readBackgroundFiles(backgroundDir);

  const rows = (await readStudentCsv(inputPath)).slice(0, limit);
  if (!rows.length) {
    throw new Error("이미지로 만들 학생 데이터가 없습니다. CSV의 A열 학번, B열 이름, C열 카드 메시지를 확인하세요.");
  }

  await mkdir(outputDir, { recursive: true });

  const manifest = [];
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const fileStem = safeFileStem(row.studentId, row.studentName);
    let backgroundPath = "";
    const outputPath = join(outputDir, `${fileStem}.png`);
    const prompt = buildCardBackgroundPrompt(row, index);

    if (options.localPreview) {
      backgroundPath = join(outputDir, `${fileStem}.background.jpg`);
      renderPreviewBackground({ outputPath: backgroundPath, index });
    } else {
      backgroundPath = backgroundFiles[index % backgroundFiles.length];
    }

    renderCard({
      backgroundPath,
      outputPath,
      message: row.message,
      footer: `${row.studentId} ${row.studentName}`
    });

    manifest.push({
      studentId: row.studentId,
      studentName: row.studentName,
      message: row.message,
      file: outputPath,
      sizePx: `${CARD_IMAGE_WIDTH}x${CARD_IMAGE_HEIGHT}`,
      printSizeMm: `${CARD_WIDTH_MM}x${CARD_HEIGHT_MM}`,
      dpi: CARD_DPI,
      font: CARD_SETTINGS.font.family,
      settings: SETTINGS_PATH,
      mode: options.localPreview ? "local-preview" : "imagegen-background",
      sourceBackground: options.localPreview ? undefined : backgroundPath,
      sourcePrompt: prompt
    });
  }

  await writeFile(
    join(outputDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );

  return manifest;
}

async function readBackgroundFiles(backgroundDir) {
  const entries = await readdir(backgroundDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => join(backgroundDir, entry.name))
    .filter((filePath) => /\.(png|jpe?g|webp)$/i.test(filePath))
    .sort((a, b) => a.localeCompare(b, "ko"));

  if (!files.length) {
    throw new Error(`배경 이미지 폴더에 PNG/JPG/WEBP 파일이 없습니다: ${backgroundDir}`);
  }

  return files;
}

function renderCard({ backgroundPath, outputPath, message, footer }) {
  const renderScript = resolve(dirname(fileURLToPath(import.meta.url)), "render_card.py");
  const args = [
    renderScript,
    "--background", backgroundPath,
    "--output", outputPath,
    "--message", message,
    "--footer", footer,
    "--width", String(CARD_IMAGE_WIDTH),
    "--height", String(CARD_IMAGE_HEIGHT),
    "--dpi", String(CARD_DPI)
  ];
  const result = spawnSync("python", args, { encoding: "utf8" });

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "카드 이미지 합성에 실패했습니다.").trim());
  }
}

function renderPreviewBackground({ outputPath, index }) {
  const previewScript = resolve(dirname(fileURLToPath(import.meta.url)), "preview_background.py");
  const result = spawnSync("python", [
    previewScript,
    "--output", outputPath,
    "--width", String(CARD_IMAGE_WIDTH),
    "--height", String(CARD_IMAGE_HEIGHT),
    "--variant", String(index)
  ], { encoding: "utf8" });

  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "미리보기 배경 생성에 실패했습니다.").trim());
  }
}

function isHeaderRow(row) {
  const first = String(row[0] || "").trim();
  const second = String(row[1] || "").trim();
  const third = String(row[2] || "").trim();
  return first.includes("학번") || second.includes("이름") || third.includes("편지");
}
