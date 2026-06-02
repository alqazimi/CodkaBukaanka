import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bin = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "concurrently.cmd" : "concurrently");

const child = spawn(
  bin,
  [
    "-n", "backend,frontend",
    "-c", "blue,green",
    "npm run dev -w backend",
    "npm run dev -w frontend",
  ],
  { cwd: root, stdio: "inherit", shell: true }
);

child.on("exit", (code) => process.exit(code ?? 0));
