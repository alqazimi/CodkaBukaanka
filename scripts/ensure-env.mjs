import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Railway/Nixpacks run `postinstall` during the image build (CI=true).
 * Copying backend/.env.example would bake USE_LOCAL_UPLOADS=true into the
 * image; dotenv would load it at runtime and the production boot guard throws.
 * On CI, rely on platform env vars only — never seed .env files into the image.
 */
if (process.env.CI === "true" || process.env.CI === "1") {
  process.exit(0);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const [example, target] of [
  ["backend/.env.example", "backend/.env"],
  ["frontend/.env.example", "frontend/.env"],
]) {
  const ex = path.join(root, example);
  const env = path.join(root, target);
  if (existsSync(ex) && !existsSync(env)) {
    copyFileSync(ex, env);
    console.log(`Created ${target} from ${example}`);
  }
}
