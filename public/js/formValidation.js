export function sanitizeStudentId(value) {
  return String(value || "").replace(/\D/g, "");
}

export function getMissingSubmitMessage(payload) {
  if (!payload?.studentId) return "학번을 입력해 주세요.";
  if (!payload?.studentName) return "이름을 입력해 주세요.";
  if (!payload?.personality || !payload?.style || !payload?.message) return "Step 1, 2, 3을 모두 선택해 주세요.";
  if (!payload?.letterText) return "먼저 AI 감사 카드 문구를 생성해 주세요.";
  if (!payload?.ethicsAccepted) return "생성형 AI 윤리 확인에 체크해야 최종 저장할 수 있습니다.";
  return "";
}
