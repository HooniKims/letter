export function validateGenerationInput(input) {
  const hasStudentInfo = typeof input?.studentInfo === "string" && input.studentInfo.trim();
  const hasSeparateStudentFields = typeof input?.studentId === "string" && input.studentId.trim()
    && typeof input?.studentName === "string" && input.studentName.trim();
  if (!hasStudentInfo && !hasSeparateStudentFields) {
    throw new Error("학번, 이름과 Step 1, 2, 3 선택이 모두 필요합니다.");
  }
  if (typeof input?.studentId === "string" && input.studentId.trim() && !/^\d+$/.test(input.studentId.trim())) {
    throw new Error("학번은 숫자만 입력할 수 있습니다.");
  }

  for (const key of ["personality", "message", "style"]) {
    if (typeof input?.[key] !== "string" || !input[key].trim()) {
      throw new Error("학번, 이름과 Step 1, 2, 3 선택이 모두 필요합니다.");
    }
  }
}
