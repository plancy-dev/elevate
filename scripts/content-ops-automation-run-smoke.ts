import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

dotenv.config({ path: ".env.local", quiet: true });

function parseArgs() {
  const argv = process.argv.slice(2);
  let host = "https://elevate.ai.kr";
  let scenario = "daily_generation";
  let source = "cursor";
  let out = "reports/ops-o2-automation-run-smoke-latest.json";
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--host" && argv[i + 1]) {
      host = argv[++i]!;
      continue;
    }
    if (a === "--scenario" && argv[i + 1]) {
      scenario = argv[++i]!;
      continue;
    }
    if (a === "--source" && argv[i + 1]) {
      source = argv[++i]!;
      continue;
    }
    if (a === "--out" && argv[i + 1]) {
      out = argv[++i]!;
      continue;
    }
  }
  return { host, scenario, source, out };
}

async function main() {
  const { host, scenario, source, out } = parseArgs();
  const token = (process.env.CONTENT_OPS_AUTOMATION_TOKEN ?? "").trim();
  const base = host.replace(/\/$/, "");
  const u = new URL(`${base}/api/content-ops/automation-run`);
  u.searchParams.set("scenario", scenario);
  u.searchParams.set("source", source);
  u.searchParams.set("token", token);

  const res = await fetch(u.toString());
  const text = await res.text();
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    body = { raw: text.slice(0, 200) };
  }

  const outDir = path.dirname(out);
  if (outDir && outDir !== ".") {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const payload = {
    kind: "ops_o2_automation_run_smoke",
    generatedAt: new Date().toISOString(),
    host: base,
    scenario,
    source,
    hasLocalToken: Boolean(token),
    httpStatus: res.status,
    bodySummary: {
      ok: body.ok,
      error: body.error,
      skipped: body.skipped,
      reason: body.reason,
      mode: body.mode,
      scenario: body.scenario,
    },
  };

  fs.writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(JSON.stringify(payload, null, 2));

  if (res.status === 401) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[content-ops-automation-run-smoke] failed:", e);
  process.exit(1);
});
