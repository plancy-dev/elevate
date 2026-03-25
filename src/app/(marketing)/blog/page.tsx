import { MarketingSection } from "@/components/marketing/marketing-section";

export const metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <div className="border-t border-border-subtle">
      <MarketingSection
        title="Blog"
        description="Product updates and MICE industry insights. Content pipeline coming soon."
      />
    </div>
  );
}
