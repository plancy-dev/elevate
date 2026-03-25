import Link from "next/link";
import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata = { title: "Solutions" };

const items = [
  { slug: "conferences", label: "Conferences" },
  { slug: "exhibitions", label: "Exhibitions" },
  { slug: "incentive-travel", label: "Incentive travel" },
  { slug: "corporate-meetings", label: "Corporate meetings" },
];

export default function SolutionsIndexPage() {
  return (
    <div className="border-t border-border-subtle">
      <MarketingSection
        title="Solutions"
        description="Elevate adapts to your MICE use case. Explore each segment below."
      >
        <ul className="grid gap-px bg-border-subtle border border-border-subtle md:grid-cols-2">
          {items.map((item) => (
            <li key={item.slug} className="bg-layer-01">
              <Link
                href={`/solutions/${item.slug}`}
                className="block p-6 text-sm font-medium text-text-primary hover:bg-layer-02 transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>
    </div>
  );
}
