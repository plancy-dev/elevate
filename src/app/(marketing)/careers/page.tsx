import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata = { title: "Careers" };

export default function CareersPage() {
  return (
    <div className="border-t border-border-subtle">
      <MarketingSection
        title="Careers"
        description="We are hiring engineers and customer success in APAC and Europe. Send your profile to careers@elevate.example (placeholder)."
      />
    </div>
  );
}
