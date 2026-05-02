import { buildClientCardPrompt, CLIENT_CARD_SYSTEM_PROMPT, normalizeClientCardText } from "./letterPrompt.js";

export async function requestLmStudioCard(payload, config, fetchImpl = fetch) {
  validateClientConfig(config);

  const response = await fetchImpl(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.apiKey
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: CLIENT_CARD_SYSTEM_PROMPT },
        { role: "user", content: buildClientCardPrompt(payload) }
      ],
      temperature: Number(config.temperature ?? 0.8),
      top_p: Number(config.topP ?? 0.92),
      max_tokens: Number(config.maxTokens ?? 700),
      reasoning_effort: config.reasoningEffort || "none",
      enable_thinking: false,
      stream: false
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.error || data?.message || response.statusText;
    throw new Error(`브라우저 LM Studio 요청 실패 (${response.status}) ${detail}`.trim());
  }

  const text = normalizeClientCardText(extractChatCompletionText(data));
  if (!text) {
    throw new Error("브라우저 LM Studio 응답에서 카드 문구를 찾지 못했습니다.");
  }

  return {
    text,
    provider: "lmstudio-browser",
    model: config.model
  };
}

export function canUseBrowserLmStudio(config) {
  return Boolean(
    config?.routing?.defaultProvider === "lmstudio"
    && config?.lmStudio?.enabled
    && config?.lmStudio?.endpoint
    && config?.lmStudio?.apiKey
  );
}

function validateClientConfig(config) {
  if (!config?.endpoint) throw new Error("브라우저 LM Studio endpoint가 없습니다.");
  if (!config?.apiKey) throw new Error("브라우저 LM Studio API key가 없습니다.");
  if (!config?.model) throw new Error("브라우저 LM Studio 모델명이 없습니다.");
}

function extractChatCompletionText(data) {
  if (typeof data?.output_text === "string") return data.output_text;
  if (!Array.isArray(data?.choices)) return "";

  return data.choices
    .map((choice) => choice?.message?.content || choice?.delta?.content || "")
    .filter((content) => typeof content === "string")
    .join("");
}
