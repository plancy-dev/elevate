import { execSync } from "node:child_process";

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
  mergeStateStatus: string;
  reviewDecision?: string | null;
  statusCheckRollup?: PrStatusCheck[] | null;
};

function run(command: string): string {
  return execSync(command, { stdio: "pipe", encoding: "utf8" }).trim();
}

function fail(message: string): never {
  throw new Error(`[pr-automerge-safe] ${message}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const pr = Number(args.find((arg) => arg.startsWith("--pr="))?.split("=")[1] ?? "0");
  const confirm = args.includes("--confirm");
  const mergeMethodRaw = args.find((arg) => arg.startsWith("--method="))?.split("=")[1] ?? "merge";
  const method = mergeMethodRaw === "squash" || mergeMethodRaw === "rebase" ? mergeMethodRaw : "merge";
  if (!Number.isFinite(pr) || pr <= 0) fail("missing or invalid --pr=<number>.");
  if (!confirm) fail("refusing to merge without --confirm flag.");
  return { pr, method };
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

function main() {
  const { pr, method } = parseArgs();

  const raw = run(
    `gh pr view ${pr} --json number,isDraft,state,mergeStateStatus,reviewDecision,statusCheckRollup`,
  );
  const view = JSON.parse(raw) as PrView;

  if (view.state !== "OPEN") fail(`PR #${pr} is not open (state=${view.state}).`);
  if (view.isDraft) fail(`PR #${pr} is draft.`);
  if (view.mergeStateStatus !== "CLEAN") {
    fail(`PR #${pr} is not merge-clean (mergeStateStatus=${view.mergeStateStatus}).`);
  }
  if (view.reviewDecision === "CHANGES_REQUESTED") {
    fail(`PR #${pr} has requested changes.`);
  }
  if (!allChecksSucceeded(view.statusCheckRollup)) {
    fail(`PR #${pr} has incomplete or failing checks.`);
  }

  run(`gh pr merge ${pr} --${method} --delete-branch`);
  console.log(`[pr-automerge-safe] merged PR #${pr} with method=${method}.`);
}

main();

