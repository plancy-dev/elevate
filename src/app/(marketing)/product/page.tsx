import Link from "next/link";
import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata = { title: "Product" };

const modules = [
  {
    slug: "event-management",
    title: "Event Management",
    desc: "Planning, venues, schedules, and operations in one place.",
  },
  {
    slug: "attendee-engagement",
    title: "Attendee Engagement",
    desc: "Registration, communications, and on-site experience.",
  },
  {
    slug: "analytics",
    title: "Analytics & Insights",
    desc: "KPIs, executive dashboards, and exportable reports.",
  },
  {
    slug: "ai-concierge",
    title: "AI Concierge",
    desc: "Natural-language queries over your event data (roadmap).",
  },
];

export default function ProductPage() {
  return (
    <div className="border-t border-border-subtle">
      <MarketingSection
        title="Platform"
        description="Elevate unifies MICE operations so your team can plan, run, and measure events without switching tools."
      >
        <div className="grid gap-px bg-border-subtle border border-border-subtle md:grid-cols-2">
          {modules.map((m) => (
            <Link
              key={m.slug}
              href={`/product/${m.slug}`}
              className="bg-layer-01 p-6 hover:bg-layer-02 transition-colors"
            >
              <h2 className="text-base font-semibold text-text-primary">
                {m.title}
              </h2>
              <p className="mt-2 text-sm text-text-tertiary">{m.desc}</p>
            </Link>
          ))}
        </div>
      </MarketingSection>
    </div>
  );
}
