import { getAiRoutingConfig, getLmStudioConfig, getOpenAiConfig, getSheetsConfig } from "./env.mjs";
import { formatNetworkError } from "./networkError.mjs";

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
      originHost: getHost(lmStudio.origin),
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

export async function getRuntimeDiagnosticsWithProbe(origin = "http://localhost:5173", options = {}) {
  const diagnostics = getRuntimeDiagnostics(origin);
  if (options.probe !== "lmstudio") return diagnostics;

  return {
    ...diagnostics,
    probe: {
      lmStudio: await probeLmStudio(getLmStudioConfig(origin))
    }
  };
}

async function probeLmStudio(config) {
  if (!config.apiUrl) {
    return {
      ok: false,
      reason: "LMSTUDIO_API_URL is missing"
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(buildModelsUrl(config.apiUrl), {
      method: "GET",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "X-API-Key": config.apiKey,
        Origin: config.origin,
        Referer: `${config.origin}/`
      }
    });

    const body = await response.text().catch(() => "");
    const modelIds = extractModelIds(body);
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      configuredModel: config.model,
      configuredModelExists: modelIds.includes(config.model),
      originHost: getHost(config.origin),
      modelIds,
      bodyPreview: sanitizePreview(body)
    };
  } catch (error) {
    return {
      ok: false,
      errorName: error?.name || "Error",
      message: error instanceof Error ? error.message : String(error),
      detail: formatNetworkError(error)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildModelsUrl(apiUrl) {
  const trimmed = apiUrl.replace(/\/+$/, "");
  if (trimmed.endsWith("/models")) return trimmed;
  if (trimmed.endsWith("/chat/completions")) return trimmed.replace(/\/chat\/completions$/, "/models");
  if (trimmed.endsWith("/responses")) return trimmed.replace(/\/responses$/, "/models");
  if (trimmed.endsWith("/v1")) return `${trimmed}/models`;
  return `${trimmed}/v1/models`;
}

function sanitizePreview(value) {
  return String(value || "")
    .replace(/"api_key"\s*:\s*"[^"]+"/gi, "\"api_key\":\"***\"")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer ***")
    .slice(0, 500);
}

function extractModelIds(body) {
  try {
    const payload = JSON.parse(body);
    if (!Array.isArray(payload?.data)) return [];
    return payload.data
      .map((item) => item?.id)
      .filter((id) => typeof id === "string" && id.trim());
  } catch {
    return [];
  }
}

function getHost(url) {
  if (!url) return "";
  try {
    return new URL(url).host;
  } catch {
    return "invalid-url";
  }
}
