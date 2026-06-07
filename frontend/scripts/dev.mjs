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
const nextDir = path.join(root, process.env.NEXT_DIST_DIR ?? ".next-dev");
const onOneDrive = process.platform === "win32" && /OneDrive/i.test(root);

// Stop stale dev servers on common frontend ports before touching the dev cache
for (const p of [3000, 3001, 3002, 3003]) {
  freePort(p);
}

function removeDirWithRetry(dir) {
  rmSync(dir, {
    recursive: true,
    force: true,
    maxRetries: process.platform === "win32" ? 8 : 3,
    retryDelay: process.platform === "win32" ? 400 : 100,
  });
}

function shouldCleanNextCache() {
  if (cleanFlag) return true;
  if (process.env.NEXT_DEV_KEEP_CACHE === "1") return false;
  if (!existsSync(nextDir)) return false;

  // `next build` output in the shared folder breaks `next dev` on Windows/OneDrive.
  if (process.platform === "win32") {
    const productionMarkers = ["BUILD_ID", "export-marker.json", "images-manifest.json"];
    if (productionMarkers.some((name) => existsSync(path.join(nextDir, name)))) {
      return true;
    }

    // Partial/corrupt dev cache causes 500s and EBUSY errors on hot reload.
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
    removeDirWithRetry(nextDir);
    console.log(`[dev] Cleared ${path.basename(nextDir)} cache for a clean dev start`);
  } catch {
    console.warn(
      `[dev] Could not fully clear ${path.basename(nextDir)} — close other terminals, pause OneDrive sync, then run: npm run dev:clean`
    );
  }
}

if (onOneDrive) {
  console.log(
    "[dev] OneDrive detected — using in-memory webpack cache to reduce EBUSY file locks. If errors persist, pause OneDrive sync or run: npm run dev:clean"
  );
}

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port)], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: String(port),
    NEXT_DIST_DIR: ".next-dev",
    NEXT_DEV_ONEDRIVE: onOneDrive ? "1" : "",
  },
});

child.on("exit", (code) => process.exit(code ?? 0));
