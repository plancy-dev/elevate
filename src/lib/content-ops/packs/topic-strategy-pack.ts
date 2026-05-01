export type AudienceSegment = "operator" | "team_lead" | "founder";

export type TopicStrategyEntry = {
  id: string;
  audience: AudienceSegment;
  titlePattern: string;
  questionPattern: string;
  whyNowPattern: string;
};

export const TOPIC_STRATEGY_PACK_VERSION = "v1.0.1";

export const TOPIC_STRATEGY_PACK: readonly TopicStrategyEntry[] = [
  {
    id: "ops-reliability",
    audience: "operator",
    titlePattern: "AI automation reliability playbook",
    questionPattern: "What can break first when teams automate too quickly?",
    whyNowPattern: "Model/tool release velocity is increasing faster than ops safeguards.",
  },
  {
    id: "cost-control",
    audience: "team_lead",
    titlePattern: "AI cost control without delivery slowdown",
    questionPattern: "Where does hidden AI spend usually leak first?",
    whyNowPattern: "Teams are scaling usage before unit economics are stabilized.",
  },
  {
    id: "execution-advantage",
    audience: "founder",
    titlePattern: "Operator-grade execution moat for AI-enabled teams",
    questionPattern: "How can a small team turn AI speed into a weekly execution flywheel?",
    whyNowPattern: "Winning teams now differentiate on operator rhythm, not model novelty.",
  },
];

export function resolveTopicStrategyByWeekday(date = new Date()): TopicStrategyEntry {
  const index = date.getUTCDay() % TOPIC_STRATEGY_PACK.length;
  return TOPIC_STRATEGY_PACK[index] ?? TOPIC_STRATEGY_PACK[0];
}
