import assert from "node:assert/strict";
import { test } from "node:test";

import { getMissingSubmitMessage, sanitizeStudentId } from "../public/js/formValidation.js";

test("student id sanitizer keeps only numeric characters", () => {
  assert.equal(sanitizeStudentId(" 12a-3가45 "), "12345");
});

test("missing submit message points to the first missing required item", () => {
  assert.equal(
    getMissingSubmitMessage({
      studentId: "",
      studentName: "홍길동",
      personality: "꼼꼼한",
      style: "솔직하고 차분하게",
      message: "키워주신 은혜 감사",
      letterText: "부모님, 감사해요.",
      ethicsAccepted: true
    }),
    "학번을 입력해 주세요."
  );

  assert.equal(
    getMissingSubmitMessage({
      studentId: "1100",
      studentName: "홍길동",
      personality: "꼼꼼한",
      style: "솔직하고 차분하게",
      message: "키워주신 은혜 감사",
      letterText: "",
      ethicsAccepted: true
    }),
    "먼저 AI 감사 카드 문구를 생성해 주세요."
  );

  assert.equal(
    getMissingSubmitMessage({
      studentId: "1100",
      studentName: "홍길동",
      personality: "꼼꼼한",
      style: "솔직하고 차분하게",
      message: "키워주신 은혜 감사",
      letterText: "부모님, 감사해요.",
      ethicsAccepted: true
    }),
    ""
  );
});
