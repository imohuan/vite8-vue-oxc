import { spawn } from "node:child_process";
import path from "node:path";
import { Elysia } from "elysia";
import { PUBLIC_ASSETS } from "./public-assets";

const DIST_ROOT = path.join(process.cwd(), "dist");
const API_PROXY_TARGET = process.env.SUB2API_API_URL ?? "http://127.0.0.1:3000";
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

async function proxyToApi(request: Request) {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, API_PROXY_TARGET);
  const headers = new Headers(request.headers);
  headers.delete("host");

  const init: RequestInit = {
    method: request.method,
    headers,
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  return fetch(target, init);
}

const app = new Elysia()
  .get("/api/health", () => ({
    success: true,
    data: { service: "sub2api-ui-server", apiProxy: API_PROXY_TARGET },
  }))
  .all("/api/*", async ({ request }) => proxyToApi(request))
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
  })
  .onError(({ error, set }) => {
    set.status = 400;
    const message =
      typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message ?? "请求失败")
        : "请求失败";
    return { success: false, error: message };
  });

app.listen(UI_PORT);

if (isBundledRuntime() && app.server) {
  openBrowser(`http://${app.server.hostname}:${app.server.port}`);
}

if (app.server) {
  console.info(`sub2api-ui server at http://${app.server.hostname}:${app.server.port}`);
  // console.info(`API proxy -> ${API_PROXY_TARGET}`);
}
