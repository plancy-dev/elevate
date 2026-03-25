import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="border-t border-border-subtle">
      <MarketingSection
        title="Terms of Service"
        description="Last updated: March 2026. This is a placeholder for legal review. Replace with counsel-approved text before production."
      >
        <div className="max-w-3xl space-y-4 text-sm text-text-secondary leading-relaxed">
          <p>
            By accessing or using Elevate (&quot;Service&quot;), you agree to be
            bound by these Terms. If you are using the Service on behalf of an
            organization, you represent that you have authority to bind that
            organization.
          </p>
          <p>
            The Service is provided &quot;as is&quot; without warranties of any
            kind. Your use of the Service is at your sole risk. We may modify or
            discontinue features with reasonable notice where required by law.
          </p>
          <p>
            For enterprise agreements, supplementary terms, including SLAs and
            data processing addenda, may apply and will supersede conflicting
            sections of these Terms when executed in writing.
          </p>
        </div>
      </MarketingSection>
    </div>
  );
}
