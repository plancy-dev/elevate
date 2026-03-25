import { Button } from "@/components/ui/button";
import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata = { title: "Request a Demo" };

export default function DemoPage() {
  return (
    <div className="border-t border-border-subtle">
      <MarketingSection
        title="Request a demo"
        description="See how Elevate fits your MICE workflows. A 30-minute walkthrough with your team—no sales pressure."
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
              Preferred date
            </label>
            <input
              type="date"
              className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary focus:outline-none focus:border-focus"
            />
          </div>
          <Button variant="primary" size="lg" type="submit">
            Schedule demo
          </Button>
        </form>
      </MarketingSection>
    </div>
  );
}
