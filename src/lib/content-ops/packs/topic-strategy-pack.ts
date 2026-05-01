export type AudienceSegment = "operator" | "team_lead" | "founder";

export type TopicStrategyEntry = {
  id: string;
  audience: AudienceSegment;
  titlePattern: string;
  questionPattern: string;
  whyNowPattern: string;
  comparisonPattern: string;
  contrarianPattern: string;
  evidencePattern: string;
  operatorOutcomePattern: string;
};

export const TOPIC_STRATEGY_PACK_VERSION = "v1.2.0";

export const TOPIC_STRATEGY_PACK: readonly TopicStrategyEntry[] = [
  {
    id: "ops-reliability",
    audience: "operator",
    titlePattern: "AI automation reliability playbook",
    questionPattern: "What can break first when teams automate too quickly?",
    whyNowPattern: "Model/tool release velocity is increasing faster than ops safeguards.",
    comparisonPattern: "Speed-first rollout vs guardrail-first rollout: which fails slower and recovers faster?",
    contrarianPattern:
      "Most teams think retries solve reliability. In practice, weak rollback ownership causes larger outages.",
    evidencePattern:
      "Use at least two concrete signals: one reliability incident pattern and one instrumentation trend.",
    operatorOutcomePattern:
      "Define a 7-day outcome: reduce high-severity automation failure recovery time by a measurable amount.",
  },
  {
    id: "cost-control",
    audience: "team_lead",
    titlePattern: "AI cost control without delivery slowdown",
    questionPattern: "Where does hidden AI spend usually leak first?",
    whyNowPattern: "Teams are scaling usage before unit economics are stabilized.",
    comparisonPattern: "Token caps vs workflow redesign: which option protects margin without slowing shipping?",
    contrarianPattern:
      "Many teams cut model quality first. Better gains often come from reducing low-value invocation volume.",
    evidencePattern:
      "Show one cost delta example and one workflow-level usage distribution signal from recent runs.",
    operatorOutcomePattern:
      "Define a 7-day outcome: cut low-value invocation volume while preserving critical throughput.",
  },
  {
    id: "execution-advantage",
    audience: "founder",
    titlePattern: "Operator-grade execution moat for AI-enabled teams",
    questionPattern: "How can a small team turn AI speed into a weekly execution flywheel?",
    whyNowPattern: "Winning teams now differentiate on operator rhythm, not model novelty.",
    comparisonPattern:
      "Model novelty vs execution cadence: which one compounds into a durable moat over 90 days?",
    contrarianPattern:
      "Most founders chase faster generation output. The stronger moat usually comes from tighter review loops.",
    evidencePattern:
      "Tie arguments to one decision-cycle benchmark and one quality/reliability trend from operational logs.",
    operatorOutcomePattern:
      "Define a 7-day outcome: improve draft-to-publish lead time without increasing review-required regressions.",
  },
];

export function resolveTopicStrategyByWeekday(date = new Date()): TopicStrategyEntry {
  const index = date.getUTCDay() % TOPIC_STRATEGY_PACK.length;
  return TOPIC_STRATEGY_PACK[index] ?? TOPIC_STRATEGY_PACK[0];
}
