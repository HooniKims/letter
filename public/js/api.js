import { canUseBrowserLmStudio, requestLmStudioCard } from "./clientLmStudio.js";

let clientConfigPromise = null;

export async function generateCard(payload) {
  const clientConfig = await getClientConfig().catch(() => null);
  if (canUseBrowserLmStudio(clientConfig)) {
    try {
      return await requestLmStudioCard(payload, clientConfig.lmStudio);
    } catch (error) {
      return generateCardViaServer(payload, formatError(error));
    }
  }

  return generateCardViaServer(payload);
}

export async function submitLetter(payload) {
  const response = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "최종 저장에 실패했습니다.");
  }

  return data;
}

async function generateCardViaServer(payload, browserFallbackReason = "") {
  const url = browserFallbackReason ? "/api/generate?provider=openai" : "/api/generate";
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "감사 카드 생성에 실패했습니다.");
  }

  if (!browserFallbackReason) return data;

  return {
    ...data,
    fallbackReason: data.fallbackReason
      ? `${browserFallbackReason}; ${data.fallbackReason}`
      : browserFallbackReason
  };
}

async function getClientConfig() {
  if (!clientConfigPromise) {
    clientConfigPromise = fetch("/api/client-config", {
      method: "GET",
      headers: { Accept: "application/json" }
    }).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "브라우저 AI 설정을 불러오지 못했습니다.");
      }
      return data;
    });
  }

  return clientConfigPromise;
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}
