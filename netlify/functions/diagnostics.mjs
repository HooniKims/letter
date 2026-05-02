import { loadEnv } from "../../server/env.mjs";
import { getRuntimeDiagnostics } from "../../server/diagnostics.mjs";

loadEnv();

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "지원하지 않는 요청입니다." });
  }

  const origin = event.headers?.origin || process.env.URL || "https://localhost";
  return json(200, getRuntimeDiagnostics(origin));
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body)
  };
}
