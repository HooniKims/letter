export function formatNetworkError(error) {
  const parts = [];
  const name = typeof error?.name === "string" ? error.name : "";
  const message = error instanceof Error ? error.message : String(error || "");

  if (name) parts.push(name);
  if (message && message !== name) parts.push(message);

  const cause = error?.cause;
  if (cause && typeof cause === "object") {
    const causeParts = [
      ["code", cause.code],
      ["errno", cause.errno],
      ["syscall", cause.syscall],
      ["hostname", cause.hostname],
      ["host", cause.host],
      ["address", cause.address],
      ["port", cause.port],
      ["reason", cause.reason]
    ]
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => `${key}=${value}`);

    if (causeParts.length) parts.push(`cause(${causeParts.join(", ")})`);
  }

  return parts.filter(Boolean).join(": ") || "unknown network error";
}
