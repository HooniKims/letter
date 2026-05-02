import { getAiRoutingConfig, getLmStudioConfig, getOpenAiConfig, getSheetsConfig } from "./env.mjs";

export function getRuntimeDiagnostics(origin = "http://localhost:5173") {
  const routing = getAiRoutingConfig();
  const lmStudio = getLmStudioConfig(origin);
  const openAi = getOpenAiConfig();
  const sheets = getSheetsConfig();

  return {
    runtime: {
      netlify: Boolean(process.env.NETLIFY),
      context: process.env.CONTEXT || "",
      commitRef: process.env.COMMIT_REF || ""
    },
    routing,
    env: {
      defaultAiProvider: process.env.DEFAULT_AI_PROVIDER || "",
      hasLmStudioApiUrl: Boolean(lmStudio.apiUrl),
      hasLmStudioApiKey: Boolean(lmStudio.apiKey),
      hasOpenAiApiKey: Boolean(openAi.apiKey),
      hasAppsScriptUrl: Boolean(sheets.appsScriptUrl)
    },
    lmStudio: {
      apiHost: getHost(lmStudio.apiUrl),
      model: lmStudio.model,
      timeoutMs: lmStudio.timeoutMs,
      enableThinking: lmStudio.enableThinking,
      maxTokens: lmStudio.maxTokens
    },
    openAi: {
      model: openAi.model
    }
  };
}

function getHost(url) {
  if (!url) return "";
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}
