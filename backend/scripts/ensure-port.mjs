import { execSync } from "node:child_process";

/**
 * Free a TCP port before starting the dev server (dev only).
 * Avoids EADDRINUSE when a previous backend instance was left running.
 */
export function freePort(port) {
  const pids = findListeningPids(port);
  if (pids.length === 0) return;

  for (const pid of pids) {
    try {
      if (process.platform === "win32") {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      } else {
        execSync(`kill -9 ${pid}`, { stdio: "ignore" });
      }
      console.log(`[dev] Freed port ${port} (stopped PID ${pid})`);
    } catch {
      console.warn(`[dev] Could not stop PID ${pid} on port ${port}`);
    }
  }
}

function findListeningPids(port) {
  const pids = new Set();

  try {
    if (process.platform === "win32") {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
      for (const line of out.split("\n")) {
        if (!line.includes("LISTENING")) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts.at(-1);
        if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
      }
    } else {
      const out = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: "utf8" }).trim();
      for (const pid of out.split("\n").filter(Boolean)) pids.add(pid);
    }
  } catch {
    // Port is free or tooling unavailable
  }

  return [...pids];
}

if (process.argv[1]?.endsWith("ensure-port.mjs")) {
  const port = Number(process.env.PORT) || 4000;
  freePort(port);
}
