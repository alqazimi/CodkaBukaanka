import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  ".next",
  "dist",
  "build",
  ".vercel",
  ".cursor",
]);

const PUBLIC_DIRS = [
  path.join(root, "public"),
  path.join(root, "frontend", "public"),
  path.join(root, "backend", "public"),
];

const BLOCKED_FILE_PATTERNS = [
  /(^|\/)\.env(\..+)?$/i,
  /(^|\/)\.git\//i,
  /\.(pem|key|p12|pfx|crt)$/i,
  /\.(sql|bak|old|orig|log)$/i,
  /id_rsa(\.pub)?$/i,
  /credentials?\.json$/i,
];

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      await walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

function asPosixRelative(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

async function run() {
  const findings = [];

  for (const publicDir of PUBLIC_DIRS) {
    if (!(await exists(publicDir))) continue;
    const files = await walk(publicDir);

    for (const file of files) {
      const rel = asPosixRelative(file);
      if (BLOCKED_FILE_PATTERNS.some((pattern) => pattern.test(rel))) {
        findings.push(rel);
      }
    }
  }

  if (findings.length > 0) {
    console.error("[security-check] blocked sensitive files found in public directories:");
    findings.forEach((f) => console.error(`  - ${f}`));
    console.error("[security-check] remove these files before running dev/build.");
    process.exit(1);
  }

  console.log("[security-check] ok");
}

run().catch((error) => {
  console.error("[security-check] failed:", error);
  process.exit(1);
});
