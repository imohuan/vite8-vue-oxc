import { Elysia } from "elysia";
import { logger } from "./logger";

const MOCK_ROUTES = [
  {
    method: "GET",
    path: "/api/_debug",
    description: "列出所有调试接口",
  },
  {
    method: "GET",
    path: "/api/_debug/log?level=info&message=hello",
    description: "按 level 写一条日志（debug|info|warn|error）",
  },
  {
    method: "GET",
    path: "/api/_debug/throw?message=模拟异常",
    description: "抛出 Error，走 onError + error 日志",
  },
  {
    method: "GET",
    path: "/api/_debug/http/404",
    description: "返回指定 HTTP 状态（400/401/403/404/500/502）",
  },
  {
    method: "GET",
    path: "/api/_debug/slow?ms=2000",
    description: "慢请求，测试耗时与 http 日志",
  },
  {
    method: "POST",
    path: "/api/_debug/body",
    description: "读取 JSON body；缺字段时 validation 错误",
  },
  {
    method: "GET",
    path: "/api/_debug/nested-error",
    description: "多层调用栈的 Error",
  },
  {
    method: "GET",
    path: "/api/_debug/uncaught?ms=50",
    description: "延迟触发 uncaughtException（仅调试）",
  },
] as const;

export function isMockRoutesEnabled(): boolean {
  const flag = process.env.ENABLE_MOCK_ROUTES?.toLowerCase();
  if (flag === "1" || flag === "true") return true;
  if (flag === "0" || flag === "false") return false;
  return process.env.NODE_ENV !== "production";
}

function nestedError(depth: number): never {
  if (depth <= 0) {
    throw new Error("嵌套调用栈模拟错误");
  }
  return nestedError(depth - 1);
}

function writeLogByLevel(level: string, message: string) {
  switch (level) {
    case "debug":
      logger.debug(message, { mock: true, level });
      break;
    case "warn":
      logger.warn(message, { mock: true, level });
      break;
    case "error":
      logger.error(message, new Error(message), { mock: true, level });
      break;
    case "info":
    default:
      logger.info(message, { mock: true, level: level === "info" ? level : "info" });
      break;
  }
}

export const mockRoutesPlugin = new Elysia({ name: "mock-routes" })
  .get("/api/_debug", () => ({
    success: true,
    data: {
      enabled: true,
      routes: MOCK_ROUTES,
      env: {
        ENABLE_MOCK_ROUTES: process.env.ENABLE_MOCK_ROUTES ?? "(auto)",
        NODE_ENV: process.env.NODE_ENV ?? "(unset)",
        LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
      },
    },
  }))
  .get("/api/_debug/log", ({ query }) => {
    const level = String(query.level ?? "info").toLowerCase();
    const message = String(query.message ?? `mock log: ${level}`);
    writeLogByLevel(level, message);
    return { success: true, data: { level, message, logged: true } };
  })
  .get("/api/_debug/throw", ({ query }) => {
    const message = String(query.message ?? "模拟 handler 异常");
    throw new Error(message);
  })
  .get("/api/_debug/http/:code", ({ params, set }) => {
    const code = Number(params.code);
    const allowed = [400, 401, 403, 404, 500, 502, 503];
    if (!allowed.includes(code)) {
      set.status = 400;
      return {
        success: false,
        error: `仅支持: ${allowed.join(", ")}`,
      };
    }
    set.status = code;
    if (code >= 500) {
      logger.error("模拟 HTTP 错误响应", new Error(`HTTP ${code}`), {
        mock: true,
        status: code,
      });
    } else {
      logger.warn("模拟 HTTP 错误响应", { mock: true, status: code });
    }
    return {
      success: false,
      error: `模拟 HTTP ${code}`,
      data: { status: code },
    };
  })
  .get("/api/_debug/slow", async ({ query, set }) => {
    const ms = Math.min(Math.max(Number(query.ms ?? 1000), 0), 30_000);
    await Bun.sleep(ms);
    set.status = 200;
    logger.info("慢请求完成", { mock: true, delayMs: ms });
    return { success: true, data: { delayMs: ms } };
  })
  .post("/api/_debug/body", async ({ request }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      logger.error("JSON 解析失败", error, { mock: true });
      throw new Error("请求体必须是合法 JSON");
    }
    if (
      typeof body !== "object" ||
      body === null ||
      !("name" in body) ||
      typeof (body as { name?: unknown }).name !== "string"
    ) {
      throw new Error('请求体缺少必填字段 "name"（string）');
    }
    logger.info("收到模拟 POST body", { mock: true, name: (body as { name: string }).name });
    return { success: true, data: { echo: body } };
  })
  .get("/api/_debug/nested-error", () => {
    nestedError(4);
  })
  .get("/api/_debug/uncaught", ({ query }) => {
    const ms = Math.min(Math.max(Number(query.ms ?? 50), 0), 5000);
    setTimeout(() => {
      throw new Error("模拟 uncaughtException（setTimeout）");
    }, ms);
    logger.warn("已调度 uncaughtException 模拟", { mock: true, delayMs: ms });
    return {
      success: true,
      data: {
        warning: `${ms}ms 后将触发 uncaughtException，请查看终端与 logs/error-*.log`,
        delayMs: ms,
      },
    };
  });

export function logMockRoutesEnabled() {
  if (!isMockRoutesEnabled()) return;
  logger.info("已启用 API 调试模拟路由", { prefix: "/api/_debug" });
}
