#!/usr/bin/env node
/** Lightweight load smoke — not a full k6 test. */
const API = (process.env.API_URL ?? "https://diiwaanka-bukaanka-backend-production.up.railway.app").replace(/\/$/, "");
const SITE = (process.env.SITE_URL ?? "https://www.codkabukaanka.com").replace(/\/$/, "");

const CONCURRENCY = Number(process.env.LOAD_CONCURRENCY ?? 20);
const REQUESTS = Number(process.env.LOAD_REQUESTS ?? 100);

async function hit(url) {
  const start = performance.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    await res.arrayBuffer().catch(() => null);
    return { ok: res.ok, ms: performance.now() - start, status: res.status };
  } catch {
    return { ok: false, ms: performance.now() - start, status: 0 };
  }
}

async function runBatch(url, n) {
  const results = await Promise.all(Array.from({ length: n }, () => hit(url)));
  const ok = results.filter((r) => r.ok).length;
  const avg = results.reduce((s, r) => s + r.ms, 0) / results.length;
  const p95 = [...results.map((r) => r.ms)].sort((a, b) => a - b)[Math.floor(results.length * 0.95)] ?? 0;
  return { ok, total: n, avg: Math.round(avg), p95: Math.round(p95), errors: results.filter((r) => !r.ok).length };
}

async function main() {
  console.log(`\nLoad smoke: ${REQUESTS} requests, concurrency ${CONCURRENCY}\n`);
  for (const [label, url] of [
    ["Homepage", `${SITE}/so`],
    ["API stats", `${API}/api/stats`],
    ["API health", `${API}/health`],
  ]) {
    const batches = Math.ceil(REQUESTS / CONCURRENCY);
    let totalOk = 0;
    let totalErr = 0;
    const avgs = [];
    for (let i = 0; i < batches; i++) {
      const n = Math.min(CONCURRENCY, REQUESTS - i * CONCURRENCY);
      const r = await runBatch(url, n);
      totalOk += r.ok;
      totalErr += r.errors;
      avgs.push(r.avg);
    }
    const avgMs = Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length);
    console.log(`${label}: ${totalOk}/${REQUESTS} ok, ${totalErr} errors, ~${avgMs}ms avg`);
  }
  console.log("");
}

main();
