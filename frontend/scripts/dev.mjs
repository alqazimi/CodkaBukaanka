import { rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { freePort } from "./ensure-port.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const port = Number(process.env.PORT) || 3000;
const clean = process.argv.includes("--clean");

// Stop stale dev servers on common frontend ports before touching .next
for (const p of [3000, 3001, 3002, 3003]) {
  freePort(p);
}

if (clean) {
  try {
    rmSync(path.join(root, ".next"), { recursive: true, force: true });
    console.log("[dev] Cleared .next cache");
  } catch {
    console.warn("[dev] Could not fully clear .next — stop all dev servers and retry");
  }
}

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, PORT: String(port) },
});

child.on("exit", (code) => process.exit(code ?? 0));
