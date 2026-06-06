import { existsSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { freePort } from "./ensure-port.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const port = Number(process.env.PORT) || 3000;
const cleanFlag = process.argv.includes("--clean");
const nextDir = path.join(root, ".next");

// Stop stale dev servers on common frontend ports before touching .next
for (const p of [3000, 3001, 3002, 3003]) {
  freePort(p);
}

function shouldCleanNextCache() {
  if (cleanFlag) return true;
  if (process.env.NEXT_DEV_KEEP_CACHE === "1") return false;
  if (!existsSync(nextDir)) return false;

  // `next build` output breaks `next dev` on Windows/OneDrive (readlink EINVAL on diagnostics).
  if (process.platform === "win32") {
    const productionMarkers = ["BUILD_ID", "export-marker.json", "images-manifest.json"];
    if (productionMarkers.some((name) => existsSync(path.join(nextDir, name)))) {
      return true;
    }

    // Partial/corrupt dev cache (missing routes-manifest or vendor chunks) causes 500 on /so.
    const serverDir = path.join(nextDir, "server");
    const routesManifest = path.join(nextDir, "routes-manifest.json");
    const nextIntlChunk = path.join(nextDir, "server", "vendor-chunks", "next-intl.js");
    if (existsSync(serverDir) && (!existsSync(routesManifest) || !existsSync(nextIntlChunk))) {
      return true;
    }
  }

  return false;
}

if (shouldCleanNextCache()) {
  try {
    rmSync(nextDir, { recursive: true, force: true });
    console.log("[dev] Cleared .next cache for a clean dev start");
  } catch {
    console.warn("[dev] Could not fully clear .next — stop all dev servers and run: npm run dev:clean");
  }
}

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, PORT: String(port) },
});

child.on("exit", (code) => process.exit(code ?? 0));
