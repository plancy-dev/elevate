import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata = { title: "Security" };

export default function SecurityPage() {
  return (
    <div className="border-t border-border-subtle">
      <MarketingSection
        title="Security"
        description="Elevate uses encryption in transit and at rest, least-privilege access, and regular penetration testing. Detailed security whitepaper available under NDA for Enterprise customers (placeholder)."
      />
    </div>
  );
}
