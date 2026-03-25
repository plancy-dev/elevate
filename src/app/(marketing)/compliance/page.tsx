import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata = { title: "Compliance" };

export default function CompliancePage() {
  return (
    <div className="border-t border-border-subtle">
      <MarketingSection
        title="Compliance"
        description="We support GDPR-aligned data processing, SOC 2 readiness, and regional hosting options. Your legal team can review our DPA during procurement (placeholder)."
      />
    </div>
  );
}
