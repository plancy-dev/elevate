import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="border-t border-border-subtle">
      <MarketingSection
        title="About Elevate"
        description="We build infrastructure for MICE teams who need measurable outcomes, not another spreadsheet. Founded in 2026 (placeholder)."
      />
    </div>
  );
}
