/**
 * UI Server API 测试脚本
 *
 * 用法:
 *   bun run test:api
 *   bun run test:api -- --base http://127.0.0.1:3002
 *   bun run test:api -- --only health,debug-index
 *   bun run test:api -- --include-uncaught
 *
 * 需先启动服务: bun run server
 */

const DEFAULT_BASE = process.env.SUB2API_UI_URL ?? "http://127.0.0.1:3002";
const DEFAULT_SLOW_MS = 200;

type TestResult = {
  name: string;
  ok: boolean;
  status: number;
  durationMs: number;
  detail?: string;
};

type ApiCase = {
  id: string;
  name: string;
  run: (base: string) => Promise<{ expectOk: boolean; status?: number; detail?: string }>;
};

function parseArgs(argv: string[]) {
  let base = DEFAULT_BASE;
  let only: string[] | null = null;
  let includeUncaught = false;
  let slowMs = DEFAULT_SLOW_MS;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--base" && argv[i + 1]) {
      base = argv[++i]!.replace(/\/$/, "");
    } else if (arg === "--only" && argv[i + 1]) {
      only = argv[++i]!.split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg === "--include-uncaught") {
      includeUncaught = true;
    } else if (arg === "--slow-ms" && argv[i + 1]) {
      slowMs = Math.min(Math.max(Number(argv[++i]), 0), 5000);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return { base, only, includeUncaught, slowMs };
}

function printHelp() {
  console.log(`
UI Server API 测试

  bun run test:api [options]

选项:
  --base <url>           服务地址 (默认 ${DEFAULT_BASE})
  --only <id,...>        只跑指定用例 (逗号分隔)
  --slow-ms <n>          慢请求毫秒数 (默认 ${DEFAULT_SLOW_MS})
  --include-uncaught     包含 uncaught 用例 (可能搞挂服务进程)
  -h, --help             显示帮助

用例 id:
  health, debug-index, log-info, log-error, http-404, http-500,
  throw, slow, body-ok, body-fail, nested-error, uncaught
`);
}

async function request(url: string, init?: RequestInit): Promise<{ status: number; body: string; json: unknown }> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.text();
  let json: unknown = null;
  try {
    json = body ? JSON.parse(body) : null;
  } catch {
    json = body;
  }
  return { status: res.status, body, json };
}

function buildCases(slowMs: number, includeUncaught: boolean): ApiCase[] {
  const cases: ApiCase[] = [
    {
      id: "health",
      name: "GET /api/health",
      run: async (base) => {
        const { status, json } = await request(`${base}/api/health`);
        const ok =
          status === 200 &&
          typeof json === "object" &&
          json !== null &&
          (json as { success?: boolean }).success === true;
        return { expectOk: ok, status, detail: ok ? undefined : String(json) };
      },
    },
    {
      id: "debug-index",
      name: "GET /api/_debug",
      run: async (base) => {
        const { status, json } = await request(`${base}/api/_debug`);
        const ok = status === 200;
        return { expectOk: ok, status, detail: ok ? undefined : JSON.stringify(json) };
      },
    },
    {
      id: "log-info",
      name: "GET /api/_debug/log (info)",
      run: async (base) => {
        const { status, json } = await request(`${base}/api/_debug/log?level=info&message=api-test-info`);
        return { expectOk: status === 200, status, detail: JSON.stringify(json) };
      },
    },
    {
      id: "log-error",
      name: "GET /api/_debug/log (error)",
      run: async (base) => {
        const { status, json } = await request(`${base}/api/_debug/log?level=error&message=api-test-error`);
        return { expectOk: status === 200, status, detail: JSON.stringify(json) };
      },
    },
    {
      id: "http-404",
      name: "GET /api/_debug/http/404",
      run: async (base) => {
        const { status, json } = await request(`${base}/api/_debug/http/404`);
        return { expectOk: status === 404, status, detail: JSON.stringify(json) };
      },
    },
    {
      id: "http-500",
      name: "GET /api/_debug/http/500",
      run: async (base) => {
        const { status, json } = await request(`${base}/api/_debug/http/500`);
        return { expectOk: status === 500, status, detail: JSON.stringify(json) };
      },
    },
    {
      id: "throw",
      name: "GET /api/_debug/throw",
      run: async (base) => {
        const { status, body, json } = await request(`${base}/api/_debug/throw?message=api-test-throw`);
        const ok =
          status >= 400 &&
          !isPlainNotFound(body) &&
          typeof json === "object" &&
          json !== null &&
          (json as { success?: boolean }).success === false;
        return { expectOk: ok, status, detail: JSON.stringify(json) };
      },
    },
    {
      id: "slow",
      name: `GET /api/_debug/slow?ms=${slowMs}`,
      run: async (base) => {
        const { status, json } = await request(`${base}/api/_debug/slow?ms=${slowMs}`);
        return { expectOk: status === 200, status, detail: JSON.stringify(json) };
      },
    },
    {
      id: "body-ok",
      name: "POST /api/_debug/body (valid)",
      run: async (base) => {
        const { status, json } = await request(`${base}/api/_debug/body`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "api-test" }),
        });
        return { expectOk: status === 200, status, detail: JSON.stringify(json) };
      },
    },
    {
      id: "body-fail",
      name: "POST /api/_debug/body (invalid)",
      run: async (base) => {
        const { status, json } = await request(`${base}/api/_debug/body`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        });
        return { expectOk: status >= 400, status, detail: JSON.stringify(json) };
      },
    },
    {
      id: "nested-error",
      name: "GET /api/_debug/nested-error",
      run: async (base) => {
        const { status, body, json } = await request(`${base}/api/_debug/nested-error`);
        const ok =
          status >= 400 &&
          !isPlainNotFound(body) &&
          typeof json === "object" &&
          (json as { success?: boolean } | null)?.success === false;
        return { expectOk: ok, status, detail: JSON.stringify(json) };
      },
    },
  ];

  if (includeUncaught) {
    cases.push({
      id: "uncaught",
      name: "GET /api/_debug/uncaught?ms=50",
      run: async (base) => {
        const { status, json } = await request(`${base}/api/_debug/uncaught?ms=50`);
        return {
          expectOk: status === 200,
          status,
          detail: `${JSON.stringify(json)} (服务端约 50ms 后可能崩溃)`,
        };
      },
    });
  }

  return cases;
}

async function runCase(testCase: ApiCase, base: string): Promise<TestResult> {
  const started = performance.now();
  try {
    const outcome = await testCase.run(base);
    return {
      name: testCase.name,
      ok: outcome.expectOk,
      status: outcome.status ?? 0,
      durationMs: Math.round(performance.now() - started),
      detail: outcome.detail,
    };
  } catch (error) {
    return {
      name: testCase.name,
      ok: false,
      status: 0,
      durationMs: Math.round(performance.now() - started),
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

async function checkServerReachable(base: string): Promise<boolean> {
  try {
    const { status } = await request(`${base}/api/health`);
    return status === 200;
  } catch {
    return false;
  }
}

async function fetchHealthData(base: string): Promise<Record<string, unknown> | null> {
  try {
    const { status, json } = await request(`${base}/api/health`);
    if (status !== 200 || typeof json !== "object" || json === null) return null;
    const data = (json as { data?: unknown }).data;
    return typeof data === "object" && data !== null ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

async function isMockRoutesAvailable(base: string): Promise<boolean> {
  try {
    const { status, json } = await request(`${base}/api/_debug`);
    return (
      status === 200 && typeof json === "object" && json !== null && (json as { success?: boolean }).success === true
    );
  } catch {
    return false;
  }
}

function printMockUnavailableHints(healthData: Record<string, unknown> | null) {
  console.error("✗ /api/_debug 不可用（Mock 路由未启用或服务需重启）");
  if (healthData && "mockRoutes" in healthData && healthData.mockRoutes === false) {
    console.error("  /api/health 显示 mockRoutes=false");
    console.error("  设置 ENABLE_MOCK_ROUTES=true，或 NODE_ENV=development 后重启: bun run server");
    return;
  }
  if (healthData && !("mockRoutes" in healthData)) {
    console.error("  /api/health 无 mockRoutes 字段，可能是旧进程仍占用端口");
    console.error("  Windows: netstat -ano | findstr :3002");
    console.error("  然后: taskkill /PID <pid> /F");
    console.error("  再执行: bun run server");
    return;
  }
  console.error("  确保 NODE_ENV !== production，或设置 ENABLE_MOCK_ROUTES=true");
  console.error("  然后执行: bun run server");
}

function isPlainNotFound(body: string): boolean {
  return body === "Not Found" || body === '"Not Found"';
}

async function main() {
  const { base, only, includeUncaught, slowMs } = parseArgs(process.argv.slice(2));

  console.log(`\n→ 目标: ${base}`);
  console.log(`→ Mock 路由需服务非 production 或 ENABLE_MOCK_ROUTES=true\n`);

  const reachable = await checkServerReachable(base);
  if (!reachable) {
    console.error(`✗ 无法连接 ${base}/api/health`);
    console.error("  请先启动: bun run server\n");
    process.exit(1);
  }

  const healthData = await fetchHealthData(base);
  const mockOk = await isMockRoutesAvailable(base);
  const needsMock = !only || only.some((id) => id !== "health");
  if (needsMock && !mockOk) {
    printMockUnavailableHints(healthData);
    console.error("");
    process.exit(1);
  }
  if (mockOk) {
    console.log("✓ Mock 路由已就绪\n");
  }

  let cases = buildCases(slowMs, includeUncaught);
  if (only && only.length > 0) {
    const set = new Set(only);
    cases = cases.filter((c) => set.has(c.id));
    if (cases.length === 0) {
      console.error(`✗ 未找到用例: ${only.join(", ")}`);
      process.exit(1);
    }
  }

  const results: TestResult[] = [];
  for (const testCase of cases) {
    const result = await runCase(testCase, base);
    results.push(result);
    const mark = result.ok ? "✓" : "✗";
    const statusLabel = result.status > 0 ? String(result.status) : "ERR";
    console.log(
      `${mark} [${statusLabel}] ${result.name} (${result.durationMs}ms)${result.detail && !result.ok ? `\n    ${result.detail}` : ""}`,
    );
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`\n${passed}/${results.length} 通过, ${failed} 失败\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
