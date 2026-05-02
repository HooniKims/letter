import { loadEnv } from "../../server/env.mjs";
import { getClientAiConfig } from "../../server/clientConfig.mjs";

loadEnv();

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return json(405, { error: "지원하지 않는 요청입니다." });
  }

  return json(200, getClientAiConfig());
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}
