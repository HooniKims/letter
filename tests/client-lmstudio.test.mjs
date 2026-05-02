import assert from "node:assert/strict";
import { test } from "node:test";

import { getClientAiConfig } from "../server/clientConfig.mjs";
import { requestLmStudioCard } from "../public/js/clientLmStudio.js";
import { normalizeClientCardText } from "../public/js/letterPrompt.js";

const payload = {
  studentInfo: "1100 홍길동",
  personality: "부지런한",
  style: "재밌게",
  message: "키워주신 은혜 감사"
};

test("client config exposes browser LM Studio settings from NEXT_PUBLIC key", () => {
  const config = getClientAiConfig({
    env: {
      DEFAULT_AI_PROVIDER: "lmstudio",
      LMSTUDIO_API_URL: "https://lm.alluser.site",
      NEXT_PUBLIC_LOCAL_LLM_API_KEY: "public-key",
      LMSTUDIO_GEMMA_E2B_MODEL: "google/gemma-4-e2b",
      LMSTUDIO_MAX_TOKENS: "700"
    }
  });

  assert.equal(config.routing.defaultProvider, "lmstudio");
  assert.equal(config.lmStudio.endpoint, "https://lm.alluser.site/v1/chat/completions");
  assert.equal(config.lmStudio.apiKey, "public-key");
  assert.equal(config.lmStudio.model, "google/gemma-4-e2b");
  assert.equal(config.lmStudio.maxTokens, 700);
});

test("client config does not expose server-only LM Studio key", () => {
  const config = getClientAiConfig({
    env: {
      DEFAULT_AI_PROVIDER: "lmstudio",
      LMSTUDIO_API_URL: "https://lm.alluser.site",
      LMSTUDIO_API_KEY: "server-only-key",
      LMSTUDIO_GEMMA_E2B_MODEL: "google/gemma-4-e2b"
    }
  });

  assert.equal(config.lmStudio.enabled, false);
  assert.equal(config.lmStudio.apiKey, "");
});

test("browser LM Studio request uses X-API-Key and non-streaming chat completions", async () => {
  let capturedUrl = "";
  let capturedOptions = {};
  const fetchImpl = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return new Response(JSON.stringify({
      choices: [
        { message: { content: "엄마 아빠, 늘 저를 키워 주셔서 감사해요. 부모님, 오늘은 쉬는 모드를 켜고 편히 쉬셨으면 좋겠어요." } }
      ]
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  const result = await requestLmStudioCard(payload, {
    endpoint: "https://lm.alluser.site/v1/chat/completions",
    apiKey: "public-key",
    model: "google/gemma-4-e2b",
    temperature: 0.8,
    maxTokens: 700
  }, fetchImpl);

  const requestBody = JSON.parse(capturedOptions.body);
  assert.equal(capturedUrl, "https://lm.alluser.site/v1/chat/completions");
  assert.equal(capturedOptions.method, "POST");
  assert.equal(capturedOptions.headers["X-API-Key"], "public-key");
  assert.equal(capturedOptions.headers.Authorization, undefined);
  assert.equal(requestBody.model, "google/gemma-4-e2b");
  assert.equal(requestBody.stream, false);
  assert.equal(requestBody.reasoning_effort, "none");
  assert.equal(requestBody.enable_thinking, false);
  assert.match(result.text, /감사/);
  assert.equal(result.provider, "lmstudio-browser");
});

test("client card normalization removes reasoning preamble before final card text", () => {
  const text = normalizeClientCardText([
    "1. **요구사항 분석:** 두 문장인지 확인한다.",
    "2. **최종 검토:** 규칙 충족.",
    "부모님, 항상 저를 세상에서 제일 귀여운 보물처럼 아껴주셔서 정말 감사해요.",
    "부모님의 사랑 덕분에 저는 매일매일 솜사탕처럼 달콤하고 행복하게 지낼 수 있답니다."
  ].join(""));

  assert.equal(
    text,
    "부모님, 항상 저를 세상에서 제일 귀여운 보물처럼 아껴주셔서 정말 감사해요. 부모님의 사랑 덕분에 저는 매일매일 솜사탕처럼 달콤하고 행복하게 지낼 수 있답니다."
  );
});

test("client card normalization starts after internal completion marker", () => {
  const text = normalizeClientCardText(
    "5. **최종 검토:** 첫 문장은 '엄마 아빠,' 또는 '부모님,'으로 시작하는지 확인. *(내부 처리 완료)*부모님, 늘 저를 위해 밥도 차려주시고 따뜻한 사랑으로 감싸주시니 감사드려요. 부모님은 세상에서 가장 반짝이는 보석 같아서 제가 앞으로도 행복하게 살게요."
  );

  assert.equal(
    text,
    "부모님, 늘 저를 위해 밥도 차려주시고 따뜻한 사랑으로 감싸주시니 감사드려요. 부모님은 세상에서 가장 반짝이는 보석 같아서 제가 앞으로도 행복하게 살게요."
  );
});
