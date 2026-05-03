/**
 * Optional dev health: warn if vendored gstack exists but `setup` was not run
 * (browse binary missing). Exit 0 always — see GitHub #63, docs/GSTACK.md.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const gstackRoot = path.join(repoRoot, ".agents", "skills", "gstack");

if (process.env.GSTACK_CHECK === "0") {
  process.exit(0);
}

if (!fs.existsSync(gstackRoot)) {
  process.exit(0);
}

const browseUnix = path.join(gstackRoot, "browse", "dist", "browse");
const browseWin = path.join(gstackRoot, "browse", "dist", "browse.exe");
const setupArtifactsOk = fs.existsSync(browseUnix) || fs.existsSync(browseWin);

if (!setupArtifactsOk) {
  console.warn(
    "\n⚠️  gstack: `.agents/skills/gstack` is vendored but `./setup` was not run (missing `browse/dist/browse`). Slash skills will not register. Non-fatal — see docs/GSTACK.md (Generate skills).\n",
  );
}

process.exit(0);
