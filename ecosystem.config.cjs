const path = require("path");

const uiDir = __dirname;
const nodeInterpreter = process.execPath;
const viteBin = path.join(uiDir, "node_modules", "vite", "bin", "vite.js");

/** @type {import('pm2').StartOptions[]} */
const apps = [
  {
    name: "sub2api-api",
    cwd: uiDir,
    script: path.join(uiDir, "scripts", "pm2", "run-api.cjs"),
    interpreter: nodeInterpreter,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 3000,
    env: {
      NODE_ENV: "production",
    },
  },
  {
    name: "sub2api-ui",
    cwd: uiDir,
    script: viteBin,
    interpreter: nodeInterpreter,
    args: "--port 5173",
    autorestart: true,
    max_restarts: 10,
    restart_delay: 3000,
    env: {
      NODE_ENV: "development",
    },
  },
];

module.exports = { apps };
