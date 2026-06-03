import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const concurrentlyBin = require.resolve("concurrently/dist/bin/concurrently.js");

const child = spawn(
  process.execPath,
  [
    concurrentlyBin,
    "-n",
    "backend,frontend",
    "-c",
    "blue,green",
    "npm run dev -w backend",
    "npm run dev -w frontend",
  ],
  { cwd: root, stdio: "inherit", env: process.env }
);

child.on("exit", (code) => process.exit(code ?? 0));
