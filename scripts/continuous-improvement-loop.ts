import { execSync } from "node:child_process";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_LOCK_FILE = "reports/autoloop/.lock";
const DEFAULT_STOP_SWITCH_FILE = "reports/autoloop/.automerge-stop";
const DEFAULT_POLICY_VERSION = "v1-low-risk";
const DEFAULT_REQUIRED_LABEL = "low-risk";
const DEFAULT_BASE_BRANCH = "main";
const DEFAULT_ALLOWED_PATH_PATTERNS = [
  "docs/**",
  "messages/**",
  "memory-bank/**",
  "tests/unit/admin-i18n-hardcoded.test.ts",
];

type LoopStep = {
  id: string;
  command: string;
  required: boolean;
  optionalCategory?: "quality";
};

type StepResult = {
  id: string;
  ok: boolean;
  command: string;
  output: string;
  error?: string;
  skipped?: boolean;
};

type CycleReport = {
  cycle: number;
  runMode: "rehearsal" | "production";
  policyVersion: string;
  cursorRunId?: string;
  startedAt: string;
  endedAt: string;
  ok: boolean;
  stopReason?: string;
  elapsedMs: number;
  candidatePrs: number[];
  mergedPrs: number[];
  steps: StepResult[];
  recommendations: string[];
};

type ParsedArgs = {
  mode: "rehearsal" | "production";
  maxCycles: number;
  maxHours: number;
  intervalMinutes: number;
  allowDirtyTree: boolean;
  mergeEnabled: boolean;
  timeoutMs: number;
  lockFile: string;
  stopSwitchPath: string;
  policyVersion: string;
  requiredSecrets: string[];
  requiredLabel: string;
  base: string;
  allowedPaths: string[];
  prLimit: number;
  deleteMergedBranch: boolean;
  cursorRunId?: string;
};

function fail(message: string): never {
  throw new Error(`[autoloop] ${message}`);
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  fail(`invalid boolean value: ${value}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const maxCycles = Number(args.find((arg) => arg.startsWith("--max-cycles="))?.split("=")[1] ?? "3");
  const maxHours = Number(args.find((arg) => arg.startsWith("--max-hours="))?.split("=")[1] ?? "1");
  const intervalMinutes = Number(
    args.find((arg) => arg.startsWith("--interval-minutes="))?.split("=")[1] ?? "10",
  );
  const explicitMode = args.find((arg) => arg.startsWith("--mode="))?.split("=")[1];
  const dryRun = args.includes("--dry-run");
  const mode: "rehearsal" | "production" =
    explicitMode === "production" ? "production" : dryRun ? "rehearsal" : "rehearsal";
  const allowDirtyTree = args.includes("--allow-dirty-tree");
  const mergeEnabled = parseBool(
    args.find((arg) => arg.startsWith("--merge-enabled="))?.split("=")[1],
    false,
  );
  const timeoutMs = Number(
    args.find((arg) => arg.startsWith("--timeout-ms="))?.split("=")[1] ?? String(DEFAULT_TIMEOUT_MS),
  );
  const lockFile = args.find((arg) => arg.startsWith("--lock-file="))?.split("=")[1] ?? DEFAULT_LOCK_FILE;
  const stopSwitchPath =
    args.find((arg) => arg.startsWith("--stop-switch-path="))?.split("=")[1] ?? DEFAULT_STOP_SWITCH_FILE;
  const policyVersion =
    args.find((arg) => arg.startsWith("--policy-version="))?.split("=")[1] ?? DEFAULT_POLICY_VERSION;
  const requiredSecretsRaw = args.find((arg) => arg.startsWith("--required-secrets="))?.split("=")[1] ?? "";
  const requiredSecrets = requiredSecretsRaw
    .split(",")
    .map((secret) => secret.trim())
    .filter((secret) => secret.length > 0);
  const requiredLabel =
    args.find((arg) => arg.startsWith("--required-label="))?.split("=")[1] ?? DEFAULT_REQUIRED_LABEL;
  const base = args.find((arg) => arg.startsWith("--base="))?.split("=")[1] ?? DEFAULT_BASE_BRANCH;
  const allowedPathsRaw = args.find((arg) => arg.startsWith("--allowed-paths="))?.split("=")[1];
  const allowedPaths = allowedPathsRaw
    ? allowedPathsRaw
        .split(",")
        .map((pattern) => pattern.trim())
        .filter((pattern) => pattern.length > 0)
    : DEFAULT_ALLOWED_PATH_PATTERNS;
  const prLimit = Number(args.find((arg) => arg.startsWith("--pr-limit="))?.split("=")[1] ?? "5");
  const deleteMergedBranch = parseBool(
    args.find((arg) => arg.startsWith("--delete-merged-branch="))?.split("=")[1],
    true,
  );
  const cursorRunId = args.find((arg) => arg.startsWith("--cursor-run-id="))?.split("=")[1];

  const parsed: ParsedArgs = {
    mode,
    maxCycles: Number.isFinite(maxCycles) && maxCycles > 0 ? maxCycles : 3,
    maxHours: Number.isFinite(maxHours) && maxHours > 0 ? maxHours : 1,
    intervalMinutes: Number.isFinite(intervalMinutes) && intervalMinutes >= 0 ? intervalMinutes : 10,
    allowDirtyTree,
    mergeEnabled,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
    lockFile,
    stopSwitchPath,
    policyVersion,
    requiredSecrets,
    requiredLabel,
    base,
    allowedPaths,
    prLimit: Number.isFinite(prLimit) && prLimit > 0 ? prLimit : 5,
    deleteMergedBranch,
    cursorRunId,
  };
  if (parsed.mode === "production" && parsed.allowDirtyTree) {
    fail("--allow-dirty-tree is not allowed in production mode.");
  }
  if (parsed.mode !== "production" && parsed.mergeEnabled) {
    fail("--merge-enabled=true is only allowed in production mode.");
  }
  if (parsed.allowedPaths.length === 0) {
    fail("allowed path patterns cannot be empty.");
  }
  return parsed;
}

function runCommand(
  command: string,
  timeoutMs: number,
  required = false,
): { ok: boolean; output: string; error?: string } {
  try {
    const output = execSync(command, {
      stdio: "pipe",
      encoding: "utf8",
      timeout: timeoutMs,
    }).trim();
    return { ok: true, output };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    if (required) {
      return {
        ok: false,
        output: "",
        error: detail,
      };
    }
    return {
      ok: false,
      output: "",
      error: detail,
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

function nowIsoForFileName() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function assertRequiredSecrets(requiredSecrets: string[]) {
  const missing = requiredSecrets.filter((secret) => !process.env[secret]);
  if (missing.length > 0) {
    fail(`missing required secrets: ${missing.join(", ")}`);
  }
}

function acquireLock(lockFilePath: string): { release: () => void } {
  mkdirSync(join(process.cwd(), "reports", "autoloop"), { recursive: true });
  let fd: number;
  try {
    fd = openSync(lockFilePath, "wx");
  } catch {
    const lockBody = existsSync(lockFilePath) ? readFileSync(lockFilePath, "utf8") : "<unknown lock owner>";
    fail(`lock already exists at ${lockFilePath}. lock body: ${lockBody}`);
  }
  const payload = {
    pid: process.pid,
    startedAt: new Date().toISOString(),
  };
  writeFileSync(lockFilePath, `${JSON.stringify(payload)}\n`, "utf8");
  return {
    release: () => {
      closeSync(fd);
      if (existsSync(lockFilePath)) {
        unlinkSync(lockFilePath);
      }
    },
  };
}

function listLowRiskCandidates(base: string, requiredLabel: string, limit: number, timeoutMs: number): number[] {
  const result = runCommand(
    `gh pr list --state open --base ${base} --label ${requiredLabel} --limit ${limit} --json number`,
    timeoutMs,
    true,
  );
  if (!result.ok) {
    fail(`cannot list candidate PRs: ${result.error ?? "unknown error"}`);
  }
  const parsed = JSON.parse(result.output) as Array<{ number?: number }>;
  return parsed
    .map((row) => row.number ?? 0)
    .filter((number) => Number.isFinite(number) && number > 0);
}

function tryMergeCandidates(args: ParsedArgs, candidatePrs: number[]): { mergedPrs: number[]; stopReason?: string } {
  if (!args.mergeEnabled || args.mode !== "production") {
    return { mergedPrs: [] };
  }

  const mergedPrs: number[] = [];
  const allowedPathsArg = args.allowedPaths.join(",");
  for (const pr of candidatePrs) {
    const mergeAttempt = runCommand(
      [
        "pnpm pr:automerge:safe",
        `--pr=${pr}`,
        "--confirm",
        "--method=merge",
        `--timeout-ms=${args.timeoutMs}`,
        `--required-label=${args.requiredLabel}`,
        `--base=${args.base}`,
        `--allowed-paths=${allowedPathsArg}`,
        `--delete-branch=${args.deleteMergedBranch ? "true" : "false"}`,
      ].join(" "),
      args.timeoutMs,
    );
    if (!mergeAttempt.ok) {
      return {
        mergedPrs,
        stopReason: `policy_violation_or_merge_failure:pr_${pr}`,
      };
    }
    mergedPrs.push(pr);
  }
  return { mergedPrs };
}

async function main() {
  const args = parseArgs();
  const {
    mode,
    maxCycles,
    maxHours,
    intervalMinutes,
    allowDirtyTree,
    mergeEnabled,
    timeoutMs,
    lockFile,
    stopSwitchPath,
    policyVersion,
    requiredSecrets,
    requiredLabel,
    base,
    prLimit,
    cursorRunId,
  } = args;
  const startedAt = Date.now();
  const reportDir = join(process.cwd(), "reports", "autoloop");
  mkdirSync(reportDir, { recursive: true });
  const lock = acquireLock(join(process.cwd(), lockFile));

  try {
    if (mode === "production") {
      assertRequiredSecrets(requiredSecrets);
      if (mergeEnabled && !(process.env.GITHUB_TOKEN || process.env.GH_TOKEN)) {
        fail("merge-enabled production mode requires GITHUB_TOKEN or GH_TOKEN.");
      }
    }

    const steps: LoopStep[] = [
      {
        id: "health.clean-tree",
        command: "git diff --quiet && git diff --cached --quiet",
        required: !allowDirtyTree,
      },
      { id: "health.typecheck", command: "pnpm typecheck", required: true },
      { id: "health.i18n", command: "pnpm test:i18n", required: true },
      {
        id: "health.content-packs",
        command: "pnpm vitest run tests/unit/content-packs.test.ts",
        required: false,
        optionalCategory: "quality",
      },
      {
        id: "health.quality-monitor",
        command: "pnpm content-ops:quality:monitor",
        required: false,
        optionalCategory: "quality",
      },
    ];

    console.log(
      `[autoloop] start (mode=${mode}, maxCycles=${maxCycles}, maxHours=${maxHours}, intervalMinutes=${intervalMinutes}, mergeEnabled=${mergeEnabled})`,
    );

    for (let cycle = 1; cycle <= maxCycles; cycle += 1) {
      const elapsedHours = (Date.now() - startedAt) / (1000 * 60 * 60);
      if (elapsedHours > maxHours) {
        console.log(`[autoloop] stopping: maxHours exceeded (${elapsedHours.toFixed(2)}h).`);
        break;
      }

      const cycleStartMs = Date.now();
      const cycleStart = new Date(cycleStartMs).toISOString();
      const stepResults: StepResult[] = [];
      let cycleOk = true;
      let stopReason: string | undefined;
      let mergeEnabledThisCycle = mode === "production" && mergeEnabled;

      if (existsSync(join(process.cwd(), stopSwitchPath))) {
        cycleOk = false;
        stopReason = "automerge_stop_switch_present";
      }

      if (!stopReason) {
        for (const step of steps) {
          if (mode === "rehearsal" && step.id !== "health.clean-tree") {
            stepResults.push({
              id: step.id,
              ok: true,
              command: step.command,
              output: "[rehearsal] skipped command execution",
              skipped: true,
            });
            continue;
          }

          const result = runCommand(step.command, timeoutMs, step.required);
          stepResults.push({
            id: step.id,
            ok: result.ok,
            command: step.command,
            output: result.output,
            error: result.error,
          });
          if (step.required && !result.ok) {
            cycleOk = false;
            stopReason = `required_step_failed:${step.id}`;
          }

          if (!step.required && !result.ok && step.optionalCategory === "quality") {
            mergeEnabledThisCycle = false;
            cycleOk = false;
            stopReason = `soft_stop_optional_failure:${step.id}`;
            break;
          }
        }
      }

      const candidatePrs = mode === "production" ? listLowRiskCandidates(base, requiredLabel, prLimit, timeoutMs) : [];
      let mergedPrs: number[] = [];
      if (!stopReason && mergeEnabledThisCycle) {
        const mergeResult = tryMergeCandidates(args, candidatePrs);
        mergedPrs = mergeResult.mergedPrs;
        if (mergeResult.stopReason) {
          cycleOk = false;
          stopReason = mergeResult.stopReason;
        }
      }

      const recommendations = buildRecommendations(stepResults);
      const cycleEndMs = Date.now();
      const cycleEnd = new Date(cycleEndMs).toISOString();
      const report: CycleReport = {
        cycle,
        runMode: mode,
        policyVersion,
        cursorRunId,
        startedAt: cycleStart,
        endedAt: cycleEnd,
        ok: cycleOk,
        stopReason,
        elapsedMs: cycleEndMs - cycleStartMs,
        candidatePrs,
        mergedPrs,
        steps: stepResults,
        recommendations,
      };

      const fileName = `${nowIsoForFileName()}-cycle-${cycle}.json`;
      const reportPath = join(reportDir, fileName);
      writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
      console.log(
        `[autoloop] cycle ${cycle} -> ${cycleOk ? "ok" : "halted"} (${reportPath})${
          stopReason ? ` reason=${stopReason}` : ""
        }`,
      );

      if (!cycleOk) {
        console.log("[autoloop] stopping due to policy/quality/required-check stop condition.");
        break;
      }

      if (cycle < maxCycles && intervalMinutes > 0) {
        await sleep(intervalMinutes * 60 * 1000);
      }
    }
  } finally {
    lock.release();
  }
}

void main();

