import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Brain,
  Globe,
  Shield,
  Users,
  Workflow,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KPIDashboardPreview } from "@/components/marketing/kpi-dashboard-preview";

const capabilities = [
  {
    icon: <Workflow className="h-5 w-5" />,
    title: "End-to-End Event Orchestration",
    description:
      "From venue sourcing to post-event analytics—manage touchpoints of your MICE program in a single workspace.",
  },
  {
    icon: <Brain className="h-5 w-5" />,
    title: "AI-Powered Insights",
    description:
      "Surface attendance trends, resource needs, and recommendations to support planning and follow-up.",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Attendee Engagement",
    description:
      "Schedules, segments, and check-in flows that help teams run smoother on-site experiences.",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Operational Analytics",
    description:
      "Track attendance, revenue, and satisfaction metrics in dashboards built for event and executive review.",
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: "Global-ready",
    description:
      "Multi-timezone scheduling and localization-friendly structure for distributed teams.",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Security-minded design",
    description:
      "Role-based access and tenant-scoped data on Supabase—align deployment with your org policies.",
  },
];

const pillars = [
  {
    title: "Unified workspace",
    sub: "Organizations, events, venues, and attendees in one place.",
  },
  {
    title: "Built for teams",
    sub: "Roles for admins, organizers, coordinators, and viewers.",
  },
  {
    title: "Transparent metrics",
    sub: "See your own numbers—no vendor-invented benchmarks on this page.",
  },
  {
    title: "Shipped for the web",
    sub: "Modern stack: Next.js, TypeScript, and Supabase—deploy where you need.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(15,98,254,0.08),transparent_60%)]" />

        <div className="relative mx-auto max-w-[1584px] px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 py-16 lg:py-24">
            <div className="flex flex-col justify-center">
              <Badge variant="blue" className="w-fit mb-6">
                MICE Enterprise Platform
              </Badge>

              <h1 className="text-4xl font-semibold tracking-[-0.02em] leading-[1.15] lg:text-[56px] text-text-primary">
                Elevate your events.
                <br />
                <span className="text-text-tertiary">
                  Measure what matters.
                </span>
              </h1>

              <p className="mt-6 text-base text-text-secondary leading-relaxed max-w-lg">
                The enterprise-oriented workspace for MICE-style programs—conferences,
                exhibitions, and corporate meetings—with insights tied to your own
                data.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/demo">
                  <Button variant="primary" size="lg">
                    Request a Demo
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/product">
                  <Button variant="tertiary" size="lg">
                    Explore Platform
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative flex items-center">
              <div className="w-full">
                <KPIDashboardPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border-subtle bg-layer-01">
        <div className="mx-auto max-w-[1584px] px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {pillars.map((p, i) => (
              <div
                key={p.title}
                className={`py-8 px-6 ${i < 3 ? "border-r border-border-subtle" : ""}`}
              >
                <div className="text-sm font-medium text-text-primary leading-snug">
                  {p.title}
                </div>
                <div className="mt-2 text-xs text-text-tertiary leading-relaxed">
                  {p.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border-subtle">
        <div className="mx-auto max-w-[1584px] px-4 py-20 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-text-primary">
              One platform for every dimension of MICE
            </h2>
            <p className="mt-3 text-base text-text-secondary leading-relaxed">
              Replace fragmented spreadsheets with a single system of record for
              portfolios your team actually runs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border-subtle border border-border-subtle">
            {capabilities.map((cap) => (
              <Card
                key={cap.title}
                className="border-0 bg-layer-01 hover:bg-layer-02 transition-colors duration-150"
              >
                <CardContent className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center bg-highlight text-primary mb-4">
                    {cap.icon}
                  </div>
                  <h3 className="text-base font-semibold text-text-primary mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-sm text-text-tertiary leading-relaxed">
                    {cap.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border-subtle bg-layer-01">
        <div className="mx-auto max-w-[1584px] px-4 py-20 lg:px-8">
          <div className="max-w-xl">
            <Badge variant="green" className="mb-4">
              Resources
            </Badge>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">
              Case studies &amp; guides
            </h2>
            <p className="mt-3 text-sm text-text-tertiary leading-relaxed">
              We publish customer stories and product notes as they are available—no
              fabricated quotes or metrics here.
            </p>
            <Link
              href="/case-studies"
              className="inline-flex items-center gap-1.5 mt-6 text-sm text-interactive hover:text-primary transition-colors"
            >
              Browse resources
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-primary">
        <div className="mx-auto max-w-[1584px] px-4 py-16 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-[-0.02em]">
                Ready to elevate your event program?
              </h2>
              <p className="mt-2 text-base text-white/70 max-w-lg">
                Talk to us about your workflows, integrations, and rollout.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link href="/demo">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 border-0"
                >
                  Request a Demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white/80 hover:text-white hover:bg-white/10"
                >
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-white/10">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {[
                "Talk to sales about pricing",
                "Security review on request",
                "Implementation support",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-white/60" />
                  <span className="text-sm text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
