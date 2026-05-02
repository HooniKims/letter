import { generateCard, submitLetter } from "./api.js";
import { setGenerating } from "./state.js";
import { readFormPayload, readSubmitPayload, refreshSubmitAvailability, renderChoiceGroups, setGenerationLoading, setGeneratingUi, setResult, setStatus, setSubmittingUi } from "./ui.js";

renderChoiceGroups();
refreshSubmitAvailability();

document.querySelector("[data-reset]").addEventListener("click", () => {
  window.location.reload();
});

document.querySelector("#student-info").addEventListener("input", refreshSubmitAvailability);
document.querySelector("#ethics-accepted").addEventListener("change", refreshSubmitAvailability);
document.querySelector("#result").addEventListener("input", refreshSubmitAvailability);

document.querySelector("[data-generate]").addEventListener("click", async () => {
  const payload = readFormPayload();
  if (!payload.studentInfo) {
    setStatus("학번과 이름을 먼저 입력해 주세요.", "error");
    document.querySelector("#student-info").focus();
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
    setStatus(`${formatProviderName(result.provider)} ${result.model}로 감사 카드가 생성되었습니다.`, "success");
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
  if (!payload.studentInfo) {
    setStatus("학번과 이름을 먼저 입력해 주세요.", "error");
    document.querySelector("#student-info").focus();
    return;
  }

  if (!payload.personality || !payload.style || !payload.message) {
    setStatus("Step 1, 2, 3을 모두 선택해 주세요.", "error");
    return;
  }

  if (!payload.letterText) {
    setStatus("먼저 AI 감사 카드 문구를 생성해 주세요.", "error");
    return;
  }

  if (!payload.ethicsAccepted) {
    setStatus("생성형 AI 윤리 확인에 체크해야 최종 저장할 수 있습니다.", "error");
    document.querySelector("#ethics-accepted").focus();
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
  if (provider === "lmstudio") return "LM Studio";
  return "AI";
}
