import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata = { title: "Case Studies" };

export default function CaseStudiesPage() {
  return (
    <div className="border-t border-border-subtle">
      <MarketingSection
        title="Case studies"
        description="How enterprise teams use Elevate to run MICE programs at scale. Full stories coming soon."
      >
        <div className="border border-border-subtle bg-layer-01 p-8 text-sm text-text-secondary">
          We are preparing detailed case studies with measurable outcomes. In the
          meantime, request a demo to see the platform in action.
        </div>
      </MarketingSection>
    </div>
  );
}
