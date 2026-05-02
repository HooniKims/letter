import { buildCardPrompt, CARD_INSTRUCTIONS, normalizeTwoSentences } from "./cardPrompt.mjs";
import { validateGenerationInput } from "./validation.mjs";

export async function generateThankYouCardWithOpenAI(input, config) {
  validateGenerationInput(input);
  validateOpenAiConfig(config);

  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      instructions: CARD_INSTRUCTIONS,
      input: buildCardPrompt(input),
      reasoning: { effort: "minimal" },
      max_output_tokens: 220
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI 요청 실패 (${response.status}) ${detail}`.trim());
  }

  const payload = await response.json();
  const content = extractResponsesText(payload);
  if (!content || typeof content !== "string") {
    throw new Error("OpenAI 응답에서 생성 문장을 찾지 못했습니다.");
  }

  return normalizeTwoSentences(content, input);
}

function validateOpenAiConfig(config) {
  if (!config?.apiKey) {
    throw new Error(".env에 OPENAI_API_KEY 값이 필요합니다.");
  }
}

function extractResponsesText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text;

  const parts = payload?.output
    ?.filter((item) => item?.type === "message")
    ?.flatMap((item) => item.content || [])
    ?.filter((part) => part?.type === "output_text" && typeof part.text === "string")
    ?.map((part) => part.text);

  return parts?.join("\n").trim();
}
