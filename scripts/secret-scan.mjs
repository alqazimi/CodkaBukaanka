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
  "agent-transcripts",
]);

const SCAN_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".yml", ".yaml", ".md"]);

const EXCLUDE_FILES = [
  /\.env(\..+)?$/i,
  /package-lock\.json$/i,
  /pnpm-lock\.yaml$/i,
];

const SECRET_PATTERNS = [
  { name: "OpenAI key", regex: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Private key block", regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "Generic bearer token", regex: /\bbearer\s+[A-Za-z0-9\-_=]{20,}\b/i },
  { name: "Hardcoded JWT-like token", regex: /\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b/ },
];

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

function rel(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function shouldScan(file) {
  const relative = rel(file);
  if (EXCLUDE_FILES.some((pattern) => pattern.test(relative))) return false;
  return SCAN_EXT.has(path.extname(file).toLowerCase());
}

async function run() {
  const files = (await walk(root)).filter(shouldScan);
  const findings = [];

  for (const file of files) {
    const text = await fs.readFile(file, "utf8");
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(text)) {
        findings.push({ file: rel(file), pattern: pattern.name });
      }
    }
  }

  if (findings.length > 0) {
    console.error("[secret-scan] possible secrets detected:");
    for (const finding of findings) {
      console.error(`  - ${finding.file} (${finding.pattern})`);
    }
    console.error("[secret-scan] remove or move secrets to env variables.");
    process.exit(1);
  }

  console.log("[secret-scan] ok");
}

run().catch((error) => {
  console.error("[secret-scan] failed:", error);
  process.exit(1);
});
