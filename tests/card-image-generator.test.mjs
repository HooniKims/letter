import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  CARD_IMAGE_HEIGHT,
  CARD_IMAGE_WIDTH,
  CARD_SETTINGS,
  DEFAULT_BACKGROUND_DIR,
  DEFAULT_INPUT_CSV,
  DEFAULT_OUTPUT_DIR,
  REQUIRED_ASPECT_RATIO,
  SETTINGS_PATH,
  buildCardBackgroundPrompt,
  parseStudentRows,
  safeFileStem
} from "../toimage/cardImageGenerator.mjs";

test("card image output uses 99.1 x 33.9mm at 300dpi", () => {
  assert.equal(CARD_IMAGE_WIDTH, 1170);
  assert.equal(CARD_IMAGE_HEIGHT, 400);
  assert.equal(REQUIRED_ASPECT_RATIO, 2.925);
  assert.match(DEFAULT_BACKGROUND_DIR.replaceAll("\\", "/"), /toimage\/sample\/backgrounds$/);
});

test("image workflow settings live inside the separate toimage folder", () => {
  assert.match(SETTINGS_PATH.replaceAll("\\", "/"), /toimage\/card-settings\.json$/);
  assert.match(DEFAULT_INPUT_CSV.replaceAll("\\", "/"), /toimage\/sample\/sample-students\.csv$/);
  assert.match(DEFAULT_OUTPUT_DIR.replaceAll("\\", "/"), /toimage\/sample$/);
  assert.equal(CARD_SETTINGS.font.family, "Paperlogy");
  assert.equal(CARD_SETTINGS.layout.message.maxLines, 3);
  assert.equal(CARD_SETTINGS.layout.contentSafeMarginMm.left, 4);
});

test("student rows are read from A, B, and C columns", () => {
  const rows = parseStudentRows([
    ["학번", "이름", "편지 내용"],
    ["1101", "김하늘", "부모님, 늘 감사해요. 오래오래 건강하세요."],
    ["1102", "이바다", ""],
    ["", "박나무", "부모님, 사랑해요."]
  ]);

  assert.deepEqual(rows, [
    {
      studentId: "1101",
      studentName: "김하늘",
      message: "부모님, 늘 감사해요. 오래오래 건강하세요."
    }
  ]);
});

test("background prompt asks for full-bleed card art without text", () => {
  const prompt = buildCardBackgroundPrompt({
    studentId: "1101",
    studentName: "김하늘",
    message: "부모님, 늘 감사해요. 오래오래 건강하세요."
  }, 1);

  assert.match(prompt, /full-bleed/);
  assert.match(prompt, /no text/i);
  assert.match(prompt, /Parents/);
  assert.match(prompt, /central area/i);
  assert.match(prompt, /carnation/i);
});

test("file stem keeps student id and Korean name safely", () => {
  assert.equal(safeFileStem("1101", "김 하늘!"), "1101_김_하늘");
});

test("image workflow does not call the OpenAI API directly", () => {
  const source = readFileSync(new URL("../toimage/cardImageGenerator.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /OPENAI_API_KEY/);
  assert.doesNotMatch(source, /v1\/images/);
});
