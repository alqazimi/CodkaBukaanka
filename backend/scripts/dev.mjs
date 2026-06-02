import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { freePort } from "./ensure-port.mjs";

const port = Number(process.env.PORT) || 4000;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

freePort(port);

function resolveTsxCli() {
  const candidates = [
    path.join(root, "node_modules", "tsx", "dist", "cli.mjs"),
    path.join(root, "..", "node_modules", "tsx", "dist", "cli.mjs"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  try {
    return require.resolve("tsx/dist/cli.mjs");
  } catch {
    throw new Error("tsx not found. Run npm install from the project root.");
  }
}

const tsxCli = resolveTsxCli();

const child = spawn(process.execPath, [tsxCli, "watch", "src/index.ts"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, PORT: String(port) },
});

child.on("exit", (code) => process.exit(code ?? 0));
