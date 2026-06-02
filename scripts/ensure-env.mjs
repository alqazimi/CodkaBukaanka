import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
