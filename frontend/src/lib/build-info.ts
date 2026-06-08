/** Git commit injected by Vercel/Railway at build time — used for deploy verification only. */
export function getBuildCommit(): string | undefined {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    process.env.RAILWAY_GIT_COMMIT_SHA?.trim() ||
    process.env.GIT_COMMIT?.trim() ||
    undefined
  );
}
