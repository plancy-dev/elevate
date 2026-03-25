import { notFound } from "next/navigation";
import { MarketingSection } from "@/components/marketing/marketing-section";

const copy: Record<string, { title: string; body: string }> = {
  conferences: {
    title: "Conferences",
    body:
      "Multi-track programs, speaker management, and sponsor visibility—built for large delegate counts and complex logistics.",
  },
  exhibitions: {
    title: "Exhibitions",
    body:
      "Booth allocation, exhibitor portals, and foot-traffic analytics to maximize floor performance.",
  },
  "incentive-travel": {
    title: "Incentive travel",
    body:
      "Curated itineraries, group coordination, and compliance-friendly reporting for executive programs.",
  },
  "corporate-meetings": {
    title: "Corporate meetings",
    body:
      "Internal town halls, leadership offsites, and hybrid formats with enterprise security and SSO.",
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const c = copy[slug];
  return { title: c?.title ?? "Solutions" };
}

export default async function SolutionPage({ params }: Props) {
  const { slug } = await params;
  const c = copy[slug];
  if (!c) notFound();

  return (
    <div className="border-t border-border-subtle">
      <MarketingSection title={c.title} description={c.body} />
    </div>
  );
}
