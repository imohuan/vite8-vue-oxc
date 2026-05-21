const { spawn } = require("child_process");
const path = require("path");

const apiDir = path.resolve(__dirname, "../../../sub2api-panel");

const child = spawn("bun", ["run", "src/index.ts"], {
  cwd: apiDir,
  stdio: "inherit",
  shell: true,
  windowsHide: true,
});

child.on("close", (code) => process.exit(code ?? 1));
child.on("error", (err) => {
  console.error("[sub2api-api]", err);
  process.exit(1);
});
