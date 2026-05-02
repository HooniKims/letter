import { generateThankYouCardWithLmStudio } from "./lmstudio.mjs";
import { generateThankYouCardWithOpenAI } from "./openai.mjs";

export async function generateThankYouCard(input, configs) {
  if (configs.routing?.defaultProvider === "openai") {
    return generateWithOpenAiFirst(input, configs);
  }

  return generateWithLmStudioFirst(input, configs);
}

async function generateWithLmStudioFirst(input, configs) {
  try {
    const text = await generateThankYouCardWithLmStudio(input, configs.lmStudio);
    return {
      text,
      provider: "lmstudio",
      model: configs.lmStudio.model
    };
  } catch (error) {
    const text = await generateThankYouCardWithOpenAI(input, configs.openAi);
    return {
      text,
      provider: "openai",
      model: configs.openAi.model,
      fallbackReason: error instanceof Error ? error.message : "LM Studio 생성에 실패해 OpenAI fallback을 사용했습니다."
    };
  }
}

async function generateWithOpenAiFirst(input, configs) {
  try {
    const text = await generateThankYouCardWithOpenAI(input, configs.openAi);
    return {
      text,
      provider: "openai",
      model: configs.openAi.model
    };
  } catch (error) {
    const text = await generateThankYouCardWithLmStudio(input, configs.lmStudio);
    return {
      text,
      provider: "lmstudio",
      model: configs.lmStudio.model,
      fallbackReason: error instanceof Error ? error.message : "OpenAI 생성에 실패해 LM Studio fallback을 사용했습니다."
    };
  }
}
