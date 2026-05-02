import { loadEnv, getAiRoutingConfig, getLmStudioConfig, getOpenAiConfig } from "../../server/env.mjs";
import { generateThankYouCard } from "../../server/generator.mjs";

loadEnv();

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "지원하지 않는 요청입니다." });
  }

  try {
    const input = parseBody(event.body);
    const origin = event.headers?.origin || process.env.URL || "https://localhost";
    const result = await generateThankYouCard(input, {
      routing: getAiRoutingConfig(),
      lmStudio: getLmStudioConfig(origin),
      openAi: getOpenAiConfig()
    });

    return json(200, result);
  } catch (error) {
    return json(500, {
      error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
    });
  }
}

function parseBody(body) {
  try {
    return JSON.parse(body || "{}");
  } catch {
    throw new Error("요청 JSON을 해석하지 못했습니다.");
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body)
  };
}
