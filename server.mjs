import { createServer } from "node:http";
import { resolve } from "node:path";
import { loadEnv, getAiRoutingConfig, getLmStudioConfig, getOpenAiConfig, getSheetsConfig } from "./server/env.mjs";
import { generateThankYouCard } from "./server/generator.mjs";
import { appendLetterSubmission } from "./server/sheets.mjs";
import { sendJson, serveStatic } from "./server/static.mjs";

loadEnv();

const PORT = Number(process.env.PORT || 5173);
const PUBLIC_DIR = resolve("public");
const LOCAL_ORIGIN = `http://localhost:${PORT}`;

const server = createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/generate") {
      const input = await readJson(req);
      const result = await generateThankYouCard(input, {
        routing: getAiRoutingConfig(),
        lmStudio: getLmStudioConfig(LOCAL_ORIGIN),
        openAi: getOpenAiConfig()
      });
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "POST" && req.url === "/api/submit") {
      const input = await readJson(req);
      const result = await appendLetterSubmission(input, getSheetsConfig());
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "GET") {
      serveStatic(req, res, PUBLIC_DIR);
      return;
    }

    sendJson(res, 405, { error: "지원하지 않는 요청입니다." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
    sendJson(res, 500, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});

function readJson(req) {
  return new Promise((resolveRead, rejectRead) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        req.destroy();
        rejectRead(new Error("요청 데이터가 너무 큽니다."));
      }
    });
    req.on("end", () => {
      try {
        resolveRead(JSON.parse(body || "{}"));
      } catch {
        rejectRead(new Error("요청 JSON을 해석하지 못했습니다."));
      }
    });
    req.on("error", rejectRead);
  });
}
