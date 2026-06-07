import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { freePort } from "./ensure-port.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

// Never run production build while dev is holding `.next-dev` / port 3000 — causes EBUSY on Windows.
for (const p of [3000, 3001, 3002, 3003]) {
  freePort(p);
}

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "build"], {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_DIST_DIR: ".next",
  },
});

child.on("exit", (code) => process.exit(code ?? 0));
