import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="border-t border-border-subtle">
      <MarketingSection
        title="Privacy Policy"
        description="Last updated: March 2026. Placeholder for GDPR-aligned privacy notice. Have your legal team review before launch."
      >
        <div className="max-w-3xl space-y-4 text-sm text-text-secondary leading-relaxed">
          <p>
            We process personal data to provide the Elevate platform, including
            authentication, event operations, analytics, and support. Lawful
            bases may include contract performance and legitimate interests,
            balanced against your rights.
          </p>
          <p>
            We use subprocessors for hosting and infrastructure (e.g. cloud
            providers). Data may be transferred internationally with appropriate
            safeguards such as Standard Contractual Clauses where applicable.
          </p>
          <p>
            You may exercise rights such as access, rectification, erasure, and
            objection by contacting your account administrator or our privacy
            contact as described in your enterprise agreement.
          </p>
        </div>
      </MarketingSection>
    </div>
  );
}
