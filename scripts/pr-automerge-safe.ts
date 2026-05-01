import { execSync } from "node:child_process";

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_BASE_BRANCH = "main";
const DEFAULT_REQUIRED_LABEL = "low-risk";
const DEFAULT_ALLOWED_PATH_PATTERNS = [
  "docs/**",
  "messages/**",
  "memory-bank/**",
  "tests/unit/admin-i18n-hardcoded.test.ts",
];

type PrStatusCheck =
  | {
      __typename: "CheckRun";
      status?: string;
      conclusion?: string | null;
      name?: string;
      workflowName?: string | null;
    }
  | {
      __typename: "StatusContext";
      state?: string;
      context?: string;
    };

type PrView = {
  number: number;
  isDraft: boolean;
  state: string;
  baseRefName: string;
  mergeStateStatus: string;
  reviewDecision?: string | null;
  labels?: Array<{ name?: string }> | null;
  files?: Array<{ path?: string }> | null;
  statusCheckRollup?: PrStatusCheck[] | null;
};

type ParsedArgs = {
  pr: number;
  method: "merge" | "squash" | "rebase";
  timeoutMs: number;
  base: string;
  requiredLabel: string;
  allowedPaths: string[];
  deleteBranch: boolean;
};

function run(command: string, timeoutMs = DEFAULT_TIMEOUT_MS): string {
  return execSync(command, {
    stdio: "pipe",
    encoding: "utf8",
    timeout: timeoutMs,
  }).trim();
}

function fail(message: string): never {
  throw new Error(`[pr-automerge-safe] ${message}`);
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  fail(`invalid boolean value: ${value}`);
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);
  const pr = Number(args.find((arg) => arg.startsWith("--pr="))?.split("=")[1] ?? "0");
  const confirm = args.includes("--confirm");
  const mergeMethodRaw = args.find((arg) => arg.startsWith("--method="))?.split("=")[1] ?? "merge";
  const method = mergeMethodRaw === "squash" || mergeMethodRaw === "rebase" ? mergeMethodRaw : "merge";
  const timeoutMs = Number(
    args.find((arg) => arg.startsWith("--timeout-ms="))?.split("=")[1] ?? String(DEFAULT_TIMEOUT_MS),
  );
  const base = args.find((arg) => arg.startsWith("--base="))?.split("=")[1] ?? DEFAULT_BASE_BRANCH;
  const requiredLabel =
    args.find((arg) => arg.startsWith("--required-label="))?.split("=")[1] ?? DEFAULT_REQUIRED_LABEL;
  const allowedPathsRaw = args.find((arg) => arg.startsWith("--allowed-paths="))?.split("=")[1];
  const deleteBranchRaw = args.find((arg) => arg.startsWith("--delete-branch="))?.split("=")[1];
  const deleteBranch = parseBool(deleteBranchRaw, true);
  const allowedPaths = allowedPathsRaw
    ? allowedPathsRaw
        .split(",")
        .map((pattern) => pattern.trim())
        .filter((pattern) => pattern.length > 0)
    : DEFAULT_ALLOWED_PATH_PATTERNS;

  if (!Number.isFinite(pr) || pr <= 0) fail("missing or invalid --pr=<number>.");
  if (!confirm) fail("refusing to merge without --confirm flag.");
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) fail("invalid --timeout-ms value.");
  if (!base) fail("invalid --base value.");
  if (!requiredLabel) fail("invalid --required-label value.");
  if (allowedPaths.length === 0) fail("allowed path patterns cannot be empty.");
  return { pr, method, timeoutMs, base, requiredLabel, allowedPaths, deleteBranch };
}

function allChecksSucceeded(checks: PrStatusCheck[] | null | undefined): boolean {
  if (!checks || checks.length === 0) return false;
  return checks.every((check) => {
    if (check.__typename === "CheckRun") {
      return check.status === "COMPLETED" && check.conclusion === "SUCCESS";
    }
    return check.state === "SUCCESS";
  });
}

function matchesPattern(path: string, pattern: string): boolean {
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return path.startsWith(prefix);
  }
  return path === pattern;
}

function filePathsWithinAllowedPatterns(
  files: Array<{ path?: string }> | null | undefined,
  allowedPatterns: string[],
): { ok: boolean; disallowedPaths: string[] } {
  const paths = (files ?? []).map((file) => file.path ?? "").filter((path) => path.length > 0);
  if (paths.length === 0) {
    return { ok: false, disallowedPaths: ["<no changed files returned by gh pr view>"] };
  }
  const disallowedPaths = paths.filter(
    (path) => !allowedPatterns.some((pattern) => matchesPattern(path, pattern)),
  );
  return { ok: disallowedPaths.length === 0, disallowedPaths };
}

function main() {
  const { pr, method, timeoutMs, base, requiredLabel, allowedPaths, deleteBranch } = parseArgs();

  const raw = run(
    `gh pr view ${pr} --json number,isDraft,state,baseRefName,mergeStateStatus,reviewDecision,labels,files,statusCheckRollup`,
    timeoutMs,
  );
  const view = JSON.parse(raw) as PrView;

  if (view.state !== "OPEN") fail(`PR #${pr} is not open (state=${view.state}).`);
  if (view.isDraft) fail(`PR #${pr} is draft.`);
  if (view.baseRefName !== base) {
    fail(`PR #${pr} targets '${view.baseRefName}', expected base '${base}'.`);
  }
  if (view.mergeStateStatus !== "CLEAN") {
    fail(`PR #${pr} is not merge-clean (mergeStateStatus=${view.mergeStateStatus}).`);
  }
  if (view.reviewDecision === "CHANGES_REQUESTED") {
    fail(`PR #${pr} has requested changes.`);
  }
  if (!allChecksSucceeded(view.statusCheckRollup)) {
    fail(`PR #${pr} has incomplete or failing checks.`);
  }

  const labels = (view.labels ?? []).map((label) => label.name ?? "").filter((label) => label.length > 0);
  if (!labels.includes(requiredLabel)) {
    fail(`PR #${pr} is missing required label '${requiredLabel}'.`);
  }

  const allowlistCheck = filePathsWithinAllowedPatterns(view.files, allowedPaths);
  if (!allowlistCheck.ok) {
    fail(
      `PR #${pr} touches disallowed paths: ${allowlistCheck.disallowedPaths.join(
        ", ",
      )}. Allowed patterns: ${allowedPaths.join(", ")}`,
    );
  }

  const deleteBranchFlag = deleteBranch ? "--delete-branch" : "";
  run(`gh pr merge ${pr} --${method} ${deleteBranchFlag}`.trim(), timeoutMs);
  console.log(
    `[pr-automerge-safe] merged PR #${pr} with method=${method}, base=${base}, requiredLabel=${requiredLabel}.`,
  );
}

main();

