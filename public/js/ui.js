import { options } from "./options.js";
import { getState, setSelection } from "./state.js";

let submitInProgress = false;
let typingTimer = null;
const lockedControlStates = new Map();

export function renderChoiceGroups() {
  for (const [group, values] of Object.entries(options)) {
    const container = document.querySelector(`[data-choice-group="${group}"]`);
    if (!container) continue;

    container.replaceChildren(
      ...values.map((value) => createChip(group, value))
    );
  }
}

export function readFormPayload() {
  const studentInfo = document.querySelector("#student-info").value.trim();
  const { selections } = getState();

  return {
    studentInfo,
    personality: selections.personality,
    style: selections.style,
    message: selections.message
  };
}

export function readSubmitPayload() {
  const { selections } = getState();

  return {
    studentInfo: document.querySelector("#student-info").value.trim(),
    letterText: document.querySelector("#result").value.trim(),
    ethicsAccepted: document.querySelector("#ethics-accepted").checked,
    personality: selections.personality,
    style: selections.style,
    message: selections.message
  };
}

export function setGeneratingUi(isGenerating) {
  const button = document.querySelector("[data-generate]");
  button.disabled = isGenerating;
  button.innerHTML = isGenerating ? "<span aria-hidden=\"true\">✦</span> 생성 중..." : "<span aria-hidden=\"true\">✦</span> 생성하기";
  refreshSubmitAvailability();
}

export function setSubmittingUi(isSubmitting) {
  submitInProgress = Boolean(isSubmitting);
  setInteractionLock(submitInProgress);

  const button = document.querySelector("[data-submit]");
  button.innerHTML = isSubmitting ? "<span aria-hidden=\"true\">✓</span> 저장 중..." : "<span aria-hidden=\"true\">✓</span> 최종 완성하기";
  refreshSubmitAvailability();
}

export function setStatus(message, tone = "") {
  const status = document.querySelector("[data-status]");
  status.textContent = message;
  status.dataset.tone = tone;
}

export function setResult(text) {
  document.querySelector("#result").value = text;
  refreshSubmitAvailability();
}

export function setGenerationLoading(isLoading) {
  const loading = document.querySelector("[data-generation-loading]");
  const result = document.querySelector("#result");
  stopTypingMessage();

  loading.hidden = !isLoading;
  result.hidden = isLoading;

  if (isLoading) {
    startTypingMessage(loading);
  }
}

export function refreshSubmitAvailability() {
  const button = document.querySelector("[data-submit]");
  if (!button) return;

  const { selections, isGenerating } = getState();
  const hasStudentInfo = Boolean(document.querySelector("#student-info")?.value.trim());
  const hasLetterText = Boolean(document.querySelector("#result")?.value.trim());
  const hasEthicsAccepted = Boolean(document.querySelector("#ethics-accepted")?.checked);
  const hasSteps = Boolean(selections.personality && selections.style && selections.message);

  button.disabled = submitInProgress || isGenerating || !(hasStudentInfo && hasSteps && hasLetterText && hasEthicsAccepted);
}

function setInteractionLock(isLocked) {
  const overlay = document.querySelector("[data-saving-lock]");
  if (overlay) overlay.hidden = !isLocked;

  const controls = document.querySelectorAll("button, input, textarea, select");
  if (isLocked) {
    lockedControlStates.clear();
    for (const control of controls) {
      lockedControlStates.set(control, control.disabled);
      control.disabled = true;
    }
    return;
  }

  for (const [control, wasDisabled] of lockedControlStates.entries()) {
    control.disabled = wasDisabled;
  }
  lockedControlStates.clear();
}

function startTypingMessage(element) {
  const message = element.dataset.loadingMessage || element.textContent.trim();
  const shouldReduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  element.classList.add("is-typing");
  element.textContent = "";

  if (shouldReduceMotion) {
    element.textContent = message;
    return;
  }

  let index = 0;
  typingTimer = window.setInterval(() => {
    element.textContent = message.slice(0, index + 1);
    index += 1;

    if (index >= message.length) {
      window.clearInterval(typingTimer);
      typingTimer = null;
    }
  }, 55);
}

function stopTypingMessage() {
  if (typingTimer) {
    window.clearInterval(typingTimer);
    typingTimer = null;
  }

  const loading = document.querySelector("[data-generation-loading]");
  if (!loading) return;

  loading.classList.remove("is-typing");
  loading.textContent = loading.dataset.loadingMessage || "부모님께 전하는 감사한 마음을 만들고 있습니다.";
}

function createChip(group, value) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  button.textContent = value;
  button.setAttribute("aria-pressed", String(getState().selections[group] === value));

  button.addEventListener("click", () => {
    setSelection(group, value);
    updateGroupPressedState(group);
    refreshSubmitAvailability();
  });

  return button;
}

function updateGroupPressedState(group) {
  const { selections } = getState();
  const chips = document.querySelectorAll(`[data-choice-group="${group}"] .chip`);

  for (const chip of chips) {
    chip.setAttribute("aria-pressed", String(chip.textContent === selections[group]));
  }
}
