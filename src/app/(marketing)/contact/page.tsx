import { Button } from "@/components/ui/button";
import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata = { title: "Contact Sales" };

export default function ContactPage() {
  return (
    <div className="border-t border-border-subtle">
      <MarketingSection
        title="Contact sales"
        description="Tell us about your event program and team size. We typically respond within one business day."
      >
        <form className="max-w-md space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Work email
            </label>
            <input
              type="email"
              className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Company
            </label>
            <input
              type="text"
              className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus"
              placeholder="Company name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Message
            </label>
            <textarea
              rows={4}
              className="w-full bg-field border border-border-subtle px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus"
              placeholder="How can we help?"
            />
          </div>
          <Button variant="primary" size="lg" type="submit">
            Send message
          </Button>
        </form>
      </MarketingSection>
    </div>
  );
}
