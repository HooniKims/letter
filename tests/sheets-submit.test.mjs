import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { getSheetsConfig } from "../server/env.mjs";
import { appendLetterSubmission } from "../server/sheets.mjs";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.GOOGLE_SHEETS_RANGE;
});

test("sheets config defaults to A:D for student id, name, letter, and timestamp", () => {
  delete process.env.GOOGLE_SHEETS_RANGE;

  const config = getSheetsConfig();

  assert.equal(config.range, "A:D");
});

test("Apps Script submission sends student id and student name as separate fields", async () => {
  let capturedBody = null;
  globalThis.fetch = async (_url, options) => {
    capturedBody = JSON.parse(options.body);
    return new Response(JSON.stringify({ ok: true, createdAt: capturedBody.createdAt }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  const result = await appendLetterSubmission({
    studentId: "1100",
    studentName: "홍길동",
    letterText: "부모님, 늘 감사해요.",
    ethicsAccepted: true,
    personality: "부지런한",
    style: "재밌게",
    message: "키워주신 은혜 감사"
  }, {
    appsScriptUrl: "https://script.google.com/macros/s/test/exec"
  });

  assert.equal(capturedBody.studentId, "1100");
  assert.equal(capturedBody.studentName, "홍길동");
  assert.equal(capturedBody.letterText, "부모님, 늘 감사해요.");
  assert.match(capturedBody.createdAt, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  assert.equal(result.backend, "apps-script");
});
