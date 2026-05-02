export function validateGenerationInput(input) {
  const required = ["studentInfo", "personality", "message", "style"];
  for (const key of required) {
    if (typeof input?.[key] !== "string" || !input[key].trim()) {
      throw new Error("학번이름과 Step 1, 2, 3 선택이 모두 필요합니다.");
    }
  }
}
