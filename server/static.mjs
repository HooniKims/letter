import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

export function serveStatic(req, res, publicDir) {
  const url = new URL(req.url, "http://localhost");
  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const absolutePath = resolve(join(publicDir, safePath));

  if (!absolutePath.startsWith(resolve(publicDir))) {
    sendText(res, 403, "Forbidden");
    return;
  }

  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    sendText(res, 404, "Not found");
    return;
  }

  const mimeType = MIME_TYPES[extname(absolutePath)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": mimeType });
  createReadStream(absolutePath).pipe(res);
}

export function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

export function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}
