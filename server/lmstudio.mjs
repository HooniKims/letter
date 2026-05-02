import { buildCardPrompt, CARD_INSTRUCTIONS, normalizeTwoSentences } from "./cardPrompt.mjs";
import { validateGenerationInput } from "./validation.mjs";

export class LmStudioTimeoutError extends Error {
  constructor(timeoutMs) {
    super(`LM Studio가 ${timeoutMs}ms 동안 카드 본문을 보내지 않아 OpenAI fallback을 사용했습니다.`);
    this.name = "LmStudioTimeoutError";
  }
}

export async function generateThankYouCardWithLmStudio(input, config) {
  validateGenerationInput(input);
  validateConfig(config);

  const endpoint = buildChatCompletionsUrl(config.apiUrl);
  const timeoutMs = config.timeoutMs || 5000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response;

  try {
    response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "X-API-Key": config.apiKey,
        Origin: config.origin,
        Referer: `${config.origin}/`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: CARD_INSTRUCTIONS },
          { role: "user", content: buildCardPrompt(input) }
        ],
        temperature: config.temperature,
        top_p: config.topP,
        presence_penalty: config.presencePenalty,
        frequency_penalty: config.frequencyPenalty,
        enable_thinking: config.enableThinking,
        max_tokens: config.maxTokens,
        stream: true
      })
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new LmStudioTimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`LM Studio 요청 실패 (${response.status}) ${detail}`.trim());
  }

  const content = await readStreamingChatCompletionText(response, controller, timeoutMs);
  if (!content || typeof content !== "string") {
    throw new Error("LM Studio 응답에서 생성 문장을 찾지 못했습니다.");
  }

  return normalizeTwoSentences(content, input);
}

function validateConfig(config) {
  if (!config?.apiUrl) {
    throw new Error(".env에 LMSTUDIO_API_URL 값이 필요합니다.");
  }
}


function buildChatCompletionsUrl(apiUrl) {
  const trimmed = apiUrl.replace(/\/+$/, "");
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  if (trimmed.endsWith("/responses")) return trimmed.replace(/\/responses$/, "/chat/completions");
  if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}

async function readStreamingChatCompletionText(response, controller, timeoutMs) {
  if (!response.body) {
    const payload = await response.json();
    return extractChatCompletionText(payload);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let generatedText = "";
  let contentTimer = setTimeout(() => controller.abort(), timeoutMs);

  const resetContentTimer = () => {
    clearTimeout(contentTimer);
    contentTimer = setTimeout(() => controller.abort(), timeoutMs);
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const drained = drainSseBuffer(buffer);
      buffer = drained.remaining;
      generatedText += drained.text;
      if (drained.text.trim()) resetContentTimer();
    }

    buffer += decoder.decode();
    const finalDrained = drainSseBuffer(`${buffer}\n`);
    generatedText += finalDrained.text;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new LmStudioTimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(contentTimer);
  }

  return generatedText.trim();
}

function drainSseBuffer(buffer) {
  const lines = buffer.split(/\r?\n/);
  const remaining = lines.pop() || "";
  let text = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;

    const data = trimmed.slice(5).trim();
    if (!data || data === "[DONE]") continue;

    try {
      text += extractChatCompletionText(JSON.parse(data));
    } catch {
      // Ignore partial or non-JSON stream frames.
    }
  }

  return { text, remaining };
}

function extractChatCompletionText(payload) {
  return payload?.choices
    ?.map((choice) => choice?.delta?.content || choice?.message?.content || "")
    ?.filter((content) => typeof content === "string")
    ?.join("");
}
