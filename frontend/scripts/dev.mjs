import { existsSync, lstatSync, mkdirSync, rmSync, symlinkSync, unlinkSync } from "node:fs";
import os from "node:os";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { freePort } from "./ensure-port.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const port = Number(process.env.PORT) || 3000;
const cleanFlag = process.argv.includes("--clean");
const onOneDrive = process.platform === "win32" && /OneDrive/i.test(root);

// Next.js distDir must stay relative — absolute paths break on Windows (joined with cwd).
const projectDevDir = path.join(root, ".next-dev");
const externalDevDir = onOneDrive
  ? path.join(process.env.LOCALAPPDATA || os.homedir(), "codkabukaanka-next-dev")
  : null;
const cacheDir = externalDevDir ?? projectDevDir;

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

function removeProjectDevLink() {
  if (!existsSync(projectDevDir)) return;
  try {
    if (lstatSync(projectDevDir).isSymbolicLink()) {
      unlinkSync(projectDevDir);
    }
  } catch {
    // Fall through — removeDirWithRetry may still clear a plain folder.
  }
}

/** Point frontend/.next-dev → %LOCALAPPDATA%/codkabukaanka-next-dev (outside OneDrive). */
function ensureProjectDevLink() {
  if (!onOneDrive || !externalDevDir) return;

  mkdirSync(externalDevDir, { recursive: true });

  if (existsSync(projectDevDir)) {
    if (lstatSync(projectDevDir).isSymbolicLink()) return;
    removeDirWithRetry(projectDevDir);
  }

  symlinkSync(externalDevDir, projectDevDir, "junction");
}

function shouldCleanNextCache() {
  if (cleanFlag) return true;
  if (process.env.NEXT_DEV_KEEP_CACHE === "1") return false;
  if (!existsSync(cacheDir)) return false;

  // `next build` output in the shared folder breaks `next dev` on Windows/OneDrive.
  if (process.platform === "win32") {
    const productionMarkers = ["BUILD_ID", "export-marker.json", "images-manifest.json"];
    if (productionMarkers.some((name) => existsSync(path.join(cacheDir, name)))) {
      return true;
    }

    // Partial/corrupt dev cache causes 500s and EBUSY errors on hot reload.
    const serverDir = path.join(cacheDir, "server");
    const routesManifest = path.join(cacheDir, "routes-manifest.json");
    const nextIntlChunk = path.join(cacheDir, "server", "vendor-chunks", "next-intl.js");
    if (existsSync(serverDir) && (!existsSync(routesManifest) || !existsSync(nextIntlChunk))) {
      return true;
    }
  }

  return false;
}

if (shouldCleanNextCache()) {
  try {
    removeProjectDevLink();
    removeDirWithRetry(cacheDir);
    console.log(`[dev] Cleared dev cache at ${cacheDir}`);
  } catch {
    console.warn(
      "[dev] Could not fully clear dev cache — close other terminals, pause OneDrive sync, then run: npm run dev:clean"
    );
  }
}

ensureProjectDevLink();

const monorepoRoot = path.resolve(root, "..");
const hoistedModules = path.join(monorepoRoot, "node_modules");
const localModules = path.join(root, "node_modules");
const nodePathEntries = [hoistedModules, localModules].filter((p) => existsSync(p));
const nodePath = [
  ...nodePathEntries,
  ...(process.env.NODE_PATH ? process.env.NODE_PATH.split(path.delimiter) : []),
]
  .filter(Boolean)
  .join(path.delimiter);

if (onOneDrive) {
  console.log(
    `[dev] OneDrive detected — dev cache: ${cacheDir}\n` +
      "[dev] Linked as frontend/.next-dev (outside OneDrive to prevent EBUSY locks)."
  );
  if (nodePathEntries.length > 0) {
    console.log(`[dev] NODE_PATH includes ${nodePathEntries.join(", ")}`);
  }
}

const nextBin = require.resolve("next/dist/bin/next");
const devArgs = ["dev", "-p", String(port)];
if (process.env.NEXT_DEV_TURBO === "1") {
  devArgs.push("--turbopack");
}

const child = spawn(process.execPath, [nextBin, ...devArgs], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    PORT: String(port),
    NEXT_DIST_DIR: ".next-dev",
    NEXT_DEV_ONEDRIVE: onOneDrive ? "1" : "",
    ...(nodePath ? { NODE_PATH: nodePath } : {}),
  },
});

child.on("exit", (code) => process.exit(code ?? 0));
