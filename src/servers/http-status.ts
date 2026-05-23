/** 将 Elysia/Bun 的 set.status 规范为数字 HTTP 状态码 */
export function toHttpStatus(status: unknown, fallback = 500): number {
  if (typeof status === "number" && status >= 100 && status <= 599) {
    return status;
  }
  if (typeof status === "string") {
    const parsed = Number(status);
    if (Number.isFinite(parsed) && parsed >= 100 && parsed <= 599) {
      return parsed;
    }
  }
  return fallback;
}
