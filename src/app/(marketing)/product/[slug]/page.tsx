import { notFound } from "next/navigation";
import { MarketingSection } from "@/components/marketing/marketing-section";

const copy: Record<string, { title: string; body: string }> = {
  "event-management": {
    title: "Event Management",
    body:
      "Centralize venues, timelines, session tracks, and staff assignments. Replace spreadsheets with a single source of truth for your portfolio.",
  },
  "attendee-engagement": {
    title: "Attendee Engagement",
    body:
      "Registration flows, email campaigns, mobile check-in, and VIP handling—designed for large programs and strict branding requirements.",
  },
  analytics: {
    title: "Analytics & Insights",
    body:
      "Real-time dashboards for attendance, revenue, NPS, and operational KPIs. Export to PDF and connect to your BI stack via API (Enterprise).",
  },
  "ai-concierge": {
    title: "AI Concierge",
    body:
      "Ask questions in plain language about schedules, capacity, and performance. Rolling out in controlled beta for Enterprise customers.",
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const c = copy[slug];
  return { title: c?.title ?? "Product" };
}

export default async function ProductModulePage({ params }: Props) {
  const { slug } = await params;
  const c = copy[slug];
  if (!c) notFound();

  return (
    <div className="border-t border-border-subtle">
      <MarketingSection title={c.title} description={c.body} />
    </div>
  );
}
