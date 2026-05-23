import { spawn } from "node:child_process";
import path from "node:path";
import { Elysia } from "elysia";
import { toHttpStatus } from "./http-status";
import { logger, registerGracefulShutdown, registerProcessErrorHandlers } from "./logger";
import { isMockRoutesEnabled, logMockRoutesEnabled, mockRoutesPlugin } from "./mock-routes";
import { PUBLIC_ASSETS } from "./public-assets";

registerProcessErrorHandlers(logger);

const DIST_ROOT = path.join(process.cwd(), "dist");
const UI_PORT = Number(process.env.SUB2API_UI_PORT ?? 3002);

function isBundledRuntime() {
  const main = Bun.main.replace(/\\/g, "/").toLowerCase();
  return main.endsWith(".exe") || main.includes("/~bun/");
}

function getPublicAsset(requestPath: string) {
  const normalized = requestPath === "/" ? "/index.html" : requestPath;
  return PUBLIC_ASSETS[normalized];
}

function servePublicAsset(asset: { contentType: string; contentBase64: string }) {
  return new Response(Buffer.from(asset.contentBase64, "base64"), {
    headers: { "content-type": asset.contentType },
  });
}

function openBrowser(url: string) {
  if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  if (process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
}

const requestTimings = new WeakMap<Request, number>();

function createApp() {
  const core = new Elysia()
    .onRequest(({ request }) => {
      requestTimings.set(request, performance.now());
      const url = new URL(request.url);
      logger.debug("收到请求", { method: request.method, path: url.pathname });
    })
    .onAfterResponse(({ request, set, response }) => {
      const url = new URL(request.url);
      const started = requestTimings.get(request) ?? performance.now();
      const durationMs = Math.round(performance.now() - started);
      const status = response instanceof Response ? response.status : toHttpStatus(set.status, 200);
      logger.http(request.method, url.pathname, status, durationMs);
    })
    .onError(({ error, set, request, code }) => {
      const url = new URL(request.url);
      const status = toHttpStatus(typeof code === "number" ? code : set.status, 500);
      set.status = status;
      logger.error("请求处理失败", error, {
        method: request.method,
        path: url.pathname,
        status,
        code,
      });
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message ?? "请求失败")
          : "请求失败";
      return { success: false, error: message, data: { status } };
    })
    .get("/api/health", () => ({
      success: true,
      data: {
        service: "sub2api-ui-server",
        mockRoutes: isMockRoutesEnabled(),
      },
    }));

  const withRoutes = isMockRoutesEnabled() ? core.use(mockRoutesPlugin) : core;

  return withRoutes
    .get("/", () => {
      if (isBundledRuntime()) {
        const asset = getPublicAsset("/");
        if (!asset) return new Response("index.html not found", { status: 500 });
        return servePublicAsset(asset);
      }
      return Bun.file(path.join(DIST_ROOT, "index.html"));
    })
    .get("/*", ({ request }) => {
      const pathname = new URL(request.url).pathname;
      if (pathname.startsWith("/api/")) {
        return new Response("Not Found", { status: 404 });
      }

      if (isBundledRuntime()) {
        const asset = getPublicAsset(pathname);
        if (!asset) return new Response("Not Found", { status: 404 });
        return servePublicAsset(asset);
      }

      return Bun.file(path.join(DIST_ROOT, pathname.replace(/^\//, "")));
    });
}

const app = createApp().listen(UI_PORT);
const server = app.server;

logMockRoutesEnabled();

registerGracefulShutdown({
  logger,
  stopServer: () => {
    server?.stop(true);
  },
});

if (isBundledRuntime() && server) {
  openBrowser(`http://${server.hostname}:${server.port}`);
}

if (server) {
  const url = `http://${server.hostname}:${server.port}`;
  logger.info("服务已启动", {
    url,
    port: server.port,
    bundled: isBundledRuntime(),
    mockRoutes: isMockRoutesEnabled(),
    debugIndex: isMockRoutesEnabled() ? `${url}/api/_debug` : undefined,
  });
}
