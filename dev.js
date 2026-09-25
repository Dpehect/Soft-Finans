const { spawn, execSync } = require("node:child_process");
const net = require("node:net");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = __dirname;
const frontendDir = path.join(rootDir, "frontend");
const BACKEND_PORT = 8010;
const FRONTEND_PORT = 5173;

// Terminal colors
const cyan = "\x1b[36m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const magenta = "\x1b[35m";
const red = "\x1b[31m";
const bold = "\x1b[1m";
const reset = "\x1b[0m";

function log(prefix, color, message) {
  const lines = message.toString().split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().length > 0) {
      console.log(`${color}${bold}[${prefix}]${reset} ${line}`);
    }
  }
}

function checkPortInUse(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("error", () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function resolvePython() {
  const candidates = [
    process.env.PYTHON,
    "python",
    "py",
    "python3",
  ].filter(Boolean);

  for (const cmd of candidates) {
    try {
      execSync(`${cmd} --version`, { stdio: "ignore" });
      return cmd;
    } catch {}
  }
  return "python";
}

let backendProc = null;
let frontendProc = null;
let isShuttingDown = false;

function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${yellow}${bold}[STOPPING] Shutting down OpenTerminalUI services...${reset}`);

  const killProc = (proc) => {
    if (!proc || !proc.pid) return;
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /pid ${proc.pid} /T /F`, { stdio: "ignore" });
      } else {
        proc.kill("SIGTERM");
      }
    } catch {}
  };

  killProc(backendProc);
  killProc(frontendProc);
  setTimeout(() => process.exit(0), 400);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

async function main() {
  console.log(`\n${cyan}${bold}===============================================${reset}`);
  console.log(`${cyan}${bold}       SoftBridge Finans Unified Dev Runner    ${reset}`);
  console.log(`${cyan}${bold}     (Admin: gurlekyunusemre2@gmail.com)       ${reset}`);
  console.log(`${cyan}${bold}===============================================${reset}\n`);

  // 1. Ensure frontend dependencies are installed
  if (!fs.existsSync(path.join(frontendDir, "node_modules"))) {
    console.log(`${yellow}[SETUP] Installing frontend dependencies (npm install)...${reset}`);
    try {
      execSync("npm install", { cwd: frontendDir, stdio: "inherit", shell: true });
      console.log(`${green}[SETUP] Frontend dependencies installed successfully.${reset}\n`);
    } catch (err) {
      console.error(`${red}[SETUP ERROR] Failed to run npm install in frontend.${reset}`, err);
    }
  }

  // 2. Start Backend if not already running on port 8010
  const backendAlreadyRunning = await checkPortInUse(BACKEND_PORT);
  if (backendAlreadyRunning) {
    console.log(`${green}[BACKEND] Detected running instance on http://127.0.0.1:${BACKEND_PORT}.${reset}`);
  } else {
    const pythonCmd = resolvePython();
    console.log(`${magenta}[BACKEND] Starting FastAPI uvicorn on http://127.0.0.1:${BACKEND_PORT} via ${pythonCmd}...${reset}`);

    const isPyLauncher = pythonCmd === "py";
    const pyExecutable = isPyLauncher ? "py" : pythonCmd;
    const pyArgs = isPyLauncher
      ? ["-3", "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", String(BACKEND_PORT)]
      : ["-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", String(BACKEND_PORT)];

    backendProc = spawn(pyExecutable, pyArgs, {
      cwd: rootDir,
      shell: true,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
        OPENTERMINALUI_ENV: "development",
        AUTH_MIDDLEWARE_ENABLED: "0",
      },
    });

    backendProc.stdout.on("data", (data) => log("BACKEND", magenta, data));
    backendProc.stderr.on("data", (data) => log("BACKEND", magenta, data));
    backendProc.on("error", (err) => log("BACKEND ERROR", red, err.message));
    backendProc.on("exit", (code) => {
      if (!isShuttingDown) {
        log("BACKEND", red, `Process exited with code ${code}`);
      }
    });
  }

  // 3. Start Frontend (Vite)
  console.log(`${cyan}[FRONTEND] Starting Vite dev server on http://localhost:${FRONTEND_PORT}...${reset}`);
  frontendProc = spawn("npx", ["vite", "--host", "0.0.0.0", "--port", String(FRONTEND_PORT)], {
    cwd: frontendDir,
    shell: true,
    env: {
      ...process.env,
      VITE_API_BASE_URL: `http://127.0.0.1:${BACKEND_PORT}/api`,
      VITE_PROXY_TARGET: `http://127.0.0.1:${BACKEND_PORT}`,
    },
  });

  frontendProc.stdout.on("data", (data) => log("FRONTEND", cyan, data));
  frontendProc.stderr.on("data", (data) => log("FRONTEND", cyan, data));
  frontendProc.on("error", (err) => log("FRONTEND ERROR", red, err.message));
  frontendProc.on("exit", (code) => {
    if (!isShuttingDown) {
      log("FRONTEND", red, `Process exited with code ${code}`);
      cleanup();
    }
  });
}

main().catch((err) => {
  console.error("Failed to run dev runner:", err);
  cleanup();
});
