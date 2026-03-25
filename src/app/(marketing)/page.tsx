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
      "From venue sourcing to post-event analytics—manage every touchpoint of your MICE program in a single, unified platform.",
  },
  {
    icon: <Brain className="h-5 w-5" />,
    title: "AI-Powered Insights",
    description:
      "Predict attendance patterns, optimize resource allocation, and surface actionable recommendations that improve event ROI by up to 40%.",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Attendee Engagement Engine",
    description:
      "Personalized schedules, smart matchmaking, and real-time interaction tools that turn passive attendees into active participants.",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Enterprise Analytics",
    description:
      "Track every KPI that matters—attendance, revenue, NPS, lead generation—with customizable dashboards built for executive reporting.",
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: "Global Scale, Local Compliance",
    description:
      "Multi-language, multi-currency, multi-timezone. GDPR, SOC 2, and ISO 27001 compliant. Ready for events anywhere in the world.",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Enterprise-Grade Security",
    description:
      "SSO, role-based access control, audit logging, and data encryption at rest and in transit. Built for organizations that take security seriously.",
  },
];

const trustedBy = [
  "Samsung",
  "Hyundai",
  "SK Group",
  "KOTRA",
  "CJ ENM",
  "Lotte",
];

const metrics = [
  { value: "15,495+", label: "Attendees Managed", subtext: "across 284 events this quarter" },
  { value: "$300M+", label: "Event Revenue Tracked", subtext: "year-over-year growth" },
  { value: "40%", label: "Avg. Efficiency Gain", subtext: "vs. legacy event tools" },
  { value: "99.9%", label: "Uptime SLA", subtext: "enterprise reliability" },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(15,98,254,0.08),transparent_60%)]" />

        <div className="relative mx-auto max-w-[1584px] px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 py-16 lg:py-24">
            {/* Left: Copy */}
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
                The enterprise platform for MICE event management. Orchestrate
                conferences, exhibitions, and corporate meetings with
                AI-powered insights that drive measurable business outcomes.
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

              <div className="mt-10 pt-6 border-t border-border-subtle">
                <p className="text-xs text-text-tertiary uppercase tracking-wider mb-3">
                  Trusted by industry leaders
                </p>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  {trustedBy.map((name) => (
                    <span
                      key={name}
                      className="text-sm font-medium text-text-tertiary"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Dashboard Preview */}
            <div className="relative flex items-center">
              <div className="w-full">
                <KPIDashboardPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Band */}
      <section className="border-b border-border-subtle bg-layer-01">
        <div className="mx-auto max-w-[1584px] px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, i) => (
              <div
                key={metric.label}
                className={`py-8 px-6 ${i < 3 ? "border-r border-border-subtle" : ""}`}
              >
                <div className="text-3xl font-semibold tracking-tight text-text-primary">
                  {metric.value}
                </div>
                <div className="mt-1 text-sm font-medium text-text-secondary">
                  {metric.label}
                </div>
                <div className="mt-0.5 text-xs text-text-tertiary">
                  {metric.subtext}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-b border-border-subtle">
        <div className="mx-auto max-w-[1584px] px-4 py-20 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] text-text-primary">
              One platform for every dimension of MICE
            </h2>
            <p className="mt-3 text-base text-text-secondary leading-relaxed">
              Replace fragmented spreadsheets and disconnected tools with a
              unified system that gives you complete visibility and control over
              your entire event portfolio.
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

      {/* Social Proof / Case Study Teaser */}
      <section className="border-b border-border-subtle bg-layer-01">
        <div className="mx-auto max-w-[1584px] px-4 py-20 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="green" className="mb-4">
                Case Study
              </Badge>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">
                &ldquo;Elevate reduced our event planning cycle from 6 months to
                6 weeks while increasing attendee satisfaction by 35%.&rdquo;
              </h2>
              <div className="mt-6">
                <div className="text-sm font-medium text-text-primary">
                  Sarah Kim
                </div>
                <div className="text-sm text-text-tertiary">
                  VP of Global Events, Fortune 500 Technology Company
                </div>
              </div>
              <Link
                href="/case-studies"
                className="inline-flex items-center gap-1.5 mt-6 text-sm text-interactive hover:text-primary transition-colors"
              >
                Read the full case study
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-px bg-border-subtle border border-border-subtle">
              {[
                { value: "6 weeks", label: "Planning cycle (was 6 months)" },
                { value: "+35%", label: "Attendee satisfaction increase" },
                { value: "2.4x", label: "More qualified leads generated" },
                { value: "$1.8M", label: "Annual cost savings" },
              ].map((stat) => (
                <div key={stat.label} className="bg-layer-01 p-6">
                  <div className="text-xl font-semibold text-primary">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-text-tertiary leading-relaxed">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary">
        <div className="mx-auto max-w-[1584px] px-4 py-16 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-semibold text-white tracking-[-0.02em]">
                Ready to elevate your event program?
              </h2>
              <p className="mt-2 text-base text-white/70 max-w-lg">
                Join the leading MICE organizations already using Elevate to
                deliver exceptional events at scale.
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
                "14-day free trial",
                "No credit card required",
                "SOC 2 & GDPR compliant",
                "Dedicated onboarding",
                "99.9% uptime SLA",
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
