import { createSign } from "node:crypto";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

export async function appendLetterSubmission(input, config) {
  validateSubmissionInput(input);

  const row = [
    input.studentInfo.trim(),
    input.letterText.trim(),
    formatKoreanTimestamp(new Date())
  ];

  if (config.appsScriptUrl) {
    return appendViaAppsScript(row, config.appsScriptUrl);
  }

  if (config.serviceAccountEmail && config.privateKey) {
    return appendViaSheetsApi(row, config);
  }

  throw new Error(
    "Google Sheets 저장 인증 정보가 없습니다. .env에 GOOGLE_APPS_SCRIPT_WEB_APP_URL 또는 GOOGLE_SERVICE_ACCOUNT_EMAIL/GOOGLE_PRIVATE_KEY를 설정해야 합니다."
  );
}

function validateSubmissionInput(input) {
  if (typeof input?.studentInfo !== "string" || !input.studentInfo.trim()) {
    throw new Error("학번과 이름이 필요합니다.");
  }
  for (const key of ["personality", "style", "message"]) {
    if (typeof input?.[key] !== "string" || !input[key].trim()) {
      throw new Error("Step 1, 2, 3 선택이 모두 필요합니다.");
    }
  }
  if (typeof input?.letterText !== "string" || !input.letterText.trim()) {
    throw new Error("저장할 편지 내용이 필요합니다.");
  }
  if (!input?.ethicsAccepted) {
    throw new Error("생성형 AI 윤리 확인에 동의해야 저장할 수 있습니다.");
  }
}

async function appendViaAppsScript(row, appsScriptUrl) {
  const response = await fetch(appsScriptUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      studentInfo: row[0],
      letterText: row[1],
      createdAt: row[2]
    })
  });

  const responseText = await response.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(extractAppsScriptError(responseText) || "Apps Script가 JSON 응답을 반환하지 않았습니다. 배포된 웹앱에 doPost 함수가 포함되어 있는지 확인해야 합니다.");
  }

  if (!response.ok || data.ok !== true) {
    throw new Error(data.error || `Apps Script 저장 실패 (${response.status})`);
  }

  return { saved: true, createdAt: row[2], backend: "apps-script" };
}

function extractAppsScriptError(text) {
  const normalized = String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "";
  if (normalized.includes("doPost")) {
    return "Apps Script 배포본에서 doPost 함수를 찾지 못했습니다. Code.gs를 붙여넣은 뒤 웹앱을 새 버전으로 다시 배포해야 합니다.";
  }
  return normalized.slice(0, 220);
}

async function appendViaSheetsApi(row, config) {
  const accessToken = await getAccessToken(config);
  const range = encodeURIComponent(config.range);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ values: [row] })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Google Sheets 저장 실패 (${response.status}) ${detail}`.trim());
  }

  return { saved: true, createdAt: row[2], backend: "sheets-api" };
}

async function getAccessToken(config) {
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt(
    {
      alg: "RS256",
      typ: "JWT"
    },
    {
      iss: config.serviceAccountEmail,
      scope: SHEETS_SCOPE,
      aud: GOOGLE_TOKEN_URL,
      exp: now + 3600,
      iat: now
    },
    config.privateKey
  );

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Google access token 발급에 실패했습니다.");
  }

  return data.access_token;
}

function signJwt(header, payload, privateKey) {
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = createSign("RSA-SHA256").update(unsignedToken).sign(privateKey);
  return `${unsignedToken}.${base64Url(signature)}`;
}

function base64Url(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function formatKoreanTimestamp(date) {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day} ${value.hour}:${value.minute}:${value.second}`;
}
