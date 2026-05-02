import { loadEnv } from "../../server/env.mjs";
import { getRuntimeDiagnosticsWithProbe } from "../../server/diagnostics.mjs";

loadEnv();

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "지원하지 않는 요청입니다." });
  }

  const origin = event.headers?.origin || process.env.URL || "https://localhost";
  const probe = event.queryStringParameters?.probe || "";
  const diagnostics = await getRuntimeDiagnosticsWithProbe(origin, { probe });

  return json(200, diagnostics);
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body)
  };
}
