import { getAiRoutingConfig } from "./env.mjs";

export function getClientAiConfig(options = {}) {
  const env = options.env || process.env;
  const routing = getAiRoutingConfigFromEnv(env);
  const apiUrl = env.LOCAL_LLM_API_URL || env.LMSTUDIO_API_URL || "";
  const endpoint = apiUrl ? buildChatCompletionsUrl(apiUrl) : "";

  return {
    routing,
    lmStudio: {
      enabled: routing.defaultProvider === "lmstudio" && Boolean(endpoint && getPublicLmStudioApiKey(env)),
      endpoint,
      apiKey: getPublicLmStudioApiKey(env),
      model: env.LMSTUDIO_MODEL || env.LMSTUDIO_GEMMA_E2B_MODEL || env.LMSTUDIO_GEMMA_E4B_MODEL || "google/gemma-4-e2b",
      temperature: Number(env.LMSTUDIO_TEMPERATURE || 0.8),
      topP: Number(env.LMSTUDIO_TOP_P || 0.92),
      maxTokens: Number(env.LMSTUDIO_MAX_TOKENS || 700),
      reasoningEffort: env.LMSTUDIO_REASONING_EFFORT || "none"
    }
  };
}

function getAiRoutingConfigFromEnv(env) {
  const provider = String(env.DEFAULT_AI_PROVIDER || "lmstudio").trim().toLowerCase();
  if (env === process.env) return getAiRoutingConfig();
  return { defaultProvider: provider === "openai" ? "openai" : "lmstudio" };
}

function getPublicLmStudioApiKey(env) {
  return env.NEXT_PUBLIC_LOCAL_LLM_API_KEY || "";
}

function buildChatCompletionsUrl(apiUrl) {
  const trimmed = apiUrl.replace(/\/+$/, "");
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  if (trimmed.endsWith("/responses")) return trimmed.replace(/\/responses$/, "/chat/completions");
  if (trimmed.endsWith("/v1")) return `${trimmed}/chat/completions`;
  return `${trimmed}/v1/chat/completions`;
}
