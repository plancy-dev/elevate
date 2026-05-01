import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type LoopStep = {
  id: string;
  command: string;
  required: boolean;
};

type StepResult = {
  id: string;
  ok: boolean;
  command: string;
  output: string;
  error?: string;
};

type CycleReport = {
  cycle: number;
  startedAt: string;
  endedAt: string;
  ok: boolean;
  steps: StepResult[];
  recommendations: string[];
};

function parseArgs() {
  const args = process.argv.slice(2);
  const maxCycles = Number(args.find((arg) => arg.startsWith("--max-cycles="))?.split("=")[1] ?? "3");
  const maxHours = Number(args.find((arg) => arg.startsWith("--max-hours="))?.split("=")[1] ?? "1");
  const intervalMinutes = Number(
    args.find((arg) => arg.startsWith("--interval-minutes="))?.split("=")[1] ?? "10",
  );
  const dryRun = args.includes("--dry-run");
  const allowDirtyTree = args.includes("--allow-dirty-tree");
  return {
    maxCycles: Number.isFinite(maxCycles) && maxCycles > 0 ? maxCycles : 3,
    maxHours: Number.isFinite(maxHours) && maxHours > 0 ? maxHours : 1,
    intervalMinutes: Number.isFinite(intervalMinutes) && intervalMinutes >= 0 ? intervalMinutes : 10,
    dryRun,
    allowDirtyTree,
  };
}

function runCommand(command: string): { ok: boolean; output: string; error?: string } {
  try {
    const output = execSync(command, { stdio: "pipe", encoding: "utf8" }).trim();
    return { ok: true, output };
  } catch (error) {
    return {
      ok: false,
      output: "",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildRecommendations(steps: StepResult[]): string[] {
  const recommendations: string[] = [];
  const failed = steps.filter((step) => !step.ok);
  if (failed.length === 0) {
    recommendations.push("All loop checks passed. Safe to continue next cycle.");
    return recommendations;
  }
  for (const step of failed) {
    if (step.id.includes("typecheck")) {
      recommendations.push("Fix TypeScript regressions before any automated merge activity.");
      continue;
    }
    if (step.id.includes("i18n")) {
      recommendations.push("Resolve locale parity/hardcoded admin text issues before proceeding.");
      continue;
    }
    if (step.id.includes("quality-monitor")) {
      recommendations.push("Inspect content quality monitor output and adjust packs before next cycle.");
      continue;
    }
    recommendations.push(`Investigate failing step: ${step.id}.`);
  }
  return recommendations;
}

async function main() {
  const { maxCycles, maxHours, intervalMinutes, dryRun, allowDirtyTree } = parseArgs();
  const startedAt = Date.now();
  const reportDir = join(process.cwd(), "reports", "autoloop");
  mkdirSync(reportDir, { recursive: true });

  const steps: LoopStep[] = [
    {
      id: "health.clean-tree",
      command: "git diff --quiet && git diff --cached --quiet",
      required: !allowDirtyTree,
    },
    { id: "health.typecheck", command: "pnpm typecheck", required: true },
    { id: "health.i18n", command: "pnpm test:i18n", required: true },
    { id: "health.content-packs", command: "pnpm vitest run tests/unit/content-packs.test.ts", required: false },
    { id: "health.quality-monitor", command: "pnpm content-ops:quality:monitor", required: false },
  ];

  console.log(
    `[autoloop] start (maxCycles=${maxCycles}, maxHours=${maxHours}, intervalMinutes=${intervalMinutes}, dryRun=${dryRun}, allowDirtyTree=${allowDirtyTree})`,
  );

  for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
    const elapsedHours = (Date.now() - startedAt) / (1000 * 60 * 60);
    if (elapsedHours > maxHours) {
      console.log(`[autoloop] stopping: maxHours exceeded (${elapsedHours.toFixed(2)}h).`);
      break;
    }

    const cycleStart = new Date().toISOString();
    const stepResults: StepResult[] = [];
    let cycleOk = true;

    for (const step of steps) {
      if (dryRun && step.id !== "health.clean-tree") {
        stepResults.push({
          id: step.id,
          ok: true,
          command: step.command,
          output: "[dry-run] skipped command execution",
        });
        continue;
      }

      const result = runCommand(step.command);
      stepResults.push({
        id: step.id,
        ok: result.ok,
        command: step.command,
        output: result.output,
        error: result.error,
      });
      if (step.required && !result.ok) {
        cycleOk = false;
      }
    }

    const recommendations = buildRecommendations(stepResults);
    const cycleEnd = new Date().toISOString();
    const report: CycleReport = {
      cycle,
      startedAt: cycleStart,
      endedAt: cycleEnd,
      ok: cycleOk,
      steps: stepResults,
      recommendations,
    };

    const fileName = `${new Date().toISOString().replace(/[:.]/g, "-")}-cycle-${cycle}.json`;
    const reportPath = join(reportDir, fileName);
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`[autoloop] cycle ${cycle} -> ${cycleOk ? "ok" : "failed"} (${reportPath})`);

    if (!cycleOk) {
      console.log("[autoloop] stopping due to required check failure.");
      break;
    }

    if (cycle < maxCycles && intervalMinutes > 0) {
      await sleep(intervalMinutes * 60 * 1000);
    }
  }
}

void main();

