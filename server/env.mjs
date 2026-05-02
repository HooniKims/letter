import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadEnv(filePath = ".env") {
  const absolutePath = resolve(filePath);
  if (!existsSync(absolutePath)) return;

  const content = readFileSync(absolutePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export function getLmStudioConfig(origin = "http://localhost:5173") {
  return {
    apiUrl: process.env.LMSTUDIO_API_URL,
    apiKey: process.env.LMSTUDIO_API_KEY || "lm-studio",
    model: process.env.LMSTUDIO_MODEL || process.env.LMSTUDIO_GEMMA_E2B_MODEL || process.env.LMSTUDIO_GEMMA_E4B_MODEL || "gemma4:e2b",
    origin: process.env.APP_ORIGIN || origin,
    timeoutMs: Number(process.env.LMSTUDIO_TIMEOUT_MS || 5000),
    temperature: Number(process.env.LMSTUDIO_TEMPERATURE || 0.92),
    topP: Number(process.env.LMSTUDIO_TOP_P || 0.92),
    presencePenalty: Number(process.env.LMSTUDIO_PRESENCE_PENALTY || 0.45),
    frequencyPenalty: Number(process.env.LMSTUDIO_FREQUENCY_PENALTY || 0.55),
    enableThinking: parseBoolean(process.env.LMSTUDIO_ENABLE_THINKING, false),
    maxTokens: Number(process.env.LMSTUDIO_MAX_TOKENS || 220)
  };
}

export function getOpenAiConfig() {
  return {
    apiUrl: process.env.OPENAI_API_URL || "https://api.openai.com/v1/responses",
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || process.env.OPENAI_FALLBACK_MODEL || "gpt-5-nano"
  };
}

export function getAiRoutingConfig() {
  const fallbackProvider = process.env.LMSTUDIO_API_URL
    ? "lmstudio"
    : process.env.NETLIFY
      ? "openai"
      : "lmstudio";
  const provider = String(process.env.DEFAULT_AI_PROVIDER || fallbackProvider).trim().toLowerCase();

  return {
    defaultProvider: provider === "openai" ? "openai" : "lmstudio"
  };
}

export function getSheetsConfig() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    || extractSpreadsheetId(process.env.GOOGLE_SHEETS_URL)
    || "1juHN4fRQzb9WAhVCqmJ7u3qfwEJQMAFCSOs_VvS5Wr0";

  return {
    appsScriptUrl: process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL,
    spreadsheetId,
    range: process.env.GOOGLE_SHEETS_RANGE || "A:C",
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  };
}

function extractSpreadsheetId(url) {
  if (!url) return "";
  const match = String(url).match(/\/spreadsheets\/d\/([^/]+)/);
  return match?.[1] || "";
}

function parseBoolean(value, fallback) {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}
