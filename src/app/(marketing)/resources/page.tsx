import Link from "next/link";
import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata = { title: "Resources" };

const items = [
  { title: "Product overview", href: "/product", desc: "Platform capabilities" },
  { title: "Security & compliance", href: "/privacy", desc: "GDPR, SOC 2, ISO 27001" },
  { title: "Pricing", href: "/pricing", desc: "Plans and comparison" },
  { title: "Case studies", href: "/case-studies", desc: "Customer outcomes" },
];

export default function ResourcesPage() {
  return (
    <div className="border-t border-border-subtle">
      <MarketingSection
        title="Resources"
        description="Documentation and guides for evaluating Elevate."
      >
        <ul className="grid gap-px bg-border-subtle border border-border-subtle">
          {items.map((item) => (
            <li key={item.href} className="bg-layer-01">
              <Link
                href={item.href}
                className="block p-5 hover:bg-layer-02 transition-colors"
              >
                <div className="text-sm font-medium text-text-primary">
                  {item.title}
                </div>
                <div className="text-xs text-text-tertiary mt-1">{item.desc}</div>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>
    </div>
  );
}
