export type AudienceSegment = "operator" | "team_lead" | "founder";

export type TopicStrategyEntry = {
  id: string;
  audience: AudienceSegment;
  titlePattern: string;
  questionPattern: string;
  whyNowPattern: string;
  comparisonPattern: string;
  contrarianPattern: string;
};

export const TOPIC_STRATEGY_PACK_VERSION = "v1.1.0";

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
  },
];

export function resolveTopicStrategyByWeekday(date = new Date()): TopicStrategyEntry {
  const index = date.getUTCDay() % TOPIC_STRATEGY_PACK.length;
  return TOPIC_STRATEGY_PACK[index] ?? TOPIC_STRATEGY_PACK[0];
}
