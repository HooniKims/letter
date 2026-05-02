import { generateCard, submitLetter } from "./api.js";
import { getMissingSubmitMessage, sanitizeStudentId } from "./formValidation.js";
import { setGenerating } from "./state.js";
import { readFormPayload, readSubmitPayload, refreshSubmitAvailability, renderChoiceGroups, setGenerationLoading, setGeneratingUi, setResult, setStatus, setSubmittingUi, showFlashMessage } from "./ui.js";

renderChoiceGroups();
refreshSubmitAvailability();

document.querySelector("[data-reset]").addEventListener("click", () => {
  window.location.reload();
});

document.querySelector("#student-id").addEventListener("input", (event) => {
  const sanitizedValue = sanitizeStudentId(event.target.value);
  if (event.target.value !== sanitizedValue) {
    event.target.value = sanitizedValue;
  }
  refreshSubmitAvailability();
});
document.querySelector("#student-name").addEventListener("input", refreshSubmitAvailability);
document.querySelector("#ethics-accepted").addEventListener("change", refreshSubmitAvailability);
document.querySelector("#result").addEventListener("input", refreshSubmitAvailability);

document.querySelector("[data-generate]").addEventListener("click", async () => {
  const payload = readFormPayload();
  if (!payload.studentId) {
    showMissingMessage("학번을 입력해 주세요.");
    document.querySelector("#student-id").focus();
    return;
  }
  if (!payload.studentName) {
    showMissingMessage("이름을 입력해 주세요.");
    document.querySelector("#student-name").focus();
    return;
  }

  try {
    setGenerating(true);
    setGeneratingUi(true);
    setStatus("");
    setResult("");
    setGenerationLoading(true);

    const result = await generateCard(payload);
    setGenerationLoading(false);
    setResult(result.text);
    const fallbackText = result.fallbackReason ? ` fallback 사유: ${result.fallbackReason}` : "";
    setStatus(`${formatProviderName(result.provider)} ${result.model}로 감사 카드가 생성되었습니다.${fallbackText}`, "success");
  } catch (error) {
    setGenerationLoading(false);
    const message = error instanceof Error ? error.message : "감사 카드 생성에 실패했습니다.";
    setStatus(message, "error");
  } finally {
    setGenerating(false);
    setGeneratingUi(false);
  }
});

document.querySelector("[data-submit]").addEventListener("click", async () => {
  const payload = readSubmitPayload();
  const missingMessage = getMissingSubmitMessage(payload);
  if (missingMessage) {
    showMissingMessage(missingMessage);
    focusFirstMissingControl(payload);
    return;
  }

  try {
    setSubmittingUi(true);
    setStatus("최종 내용을 스프레드시트에 저장하는 중입니다.");
    const result = await submitLetter(payload);
    setStatus(`최종 완성되었습니다. 저장 시각: ${result.createdAt}`, "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "최종 저장에 실패했습니다.";
    setStatus(message, "error");
  } finally {
    setSubmittingUi(false);
  }
});

function formatProviderName(provider) {
  if (provider === "openai") return "OpenAI";
  if (provider === "lmstudio" || provider === "lmstudio-browser") return "LM Studio";
  return "AI";
}

function showMissingMessage(message) {
  setStatus(message, "error");
  showFlashMessage(message, "error");
}

function focusFirstMissingControl(payload) {
  if (!payload.studentId) {
    document.querySelector("#student-id").focus();
    return;
  }
  if (!payload.studentName) {
    document.querySelector("#student-name").focus();
    return;
  }
  if (!payload.letterText) {
    document.querySelector("#result").focus();
    return;
  }
  if (!payload.ethicsAccepted) {
    document.querySelector("#ethics-accepted").focus();
  }
}
