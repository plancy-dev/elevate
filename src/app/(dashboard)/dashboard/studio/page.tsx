import { Sparkles, BookOpen, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const copy = {
  title: "Prompt Studio",
  badge: "Preview",
  intro:
    "Model-aware prompt analysis and reviewable improvements are shipping here. This page is the home for the killer loop—try the Library for e-books and guides today, and watch this space as we wire LLM-backed flows.",
  bullets: [
    "Choose a target model and paste a prompt.",
    "Get structured suggestions (full diff + accept flows on the roadmap).",
    "Keep work inside your org with Library and billing.",
  ],
  ctaLibrary: "Open Library",
  ctaBilling: "Billing & checkout",
  note: "API contract for improvements is defined in docs/adr/ADR-002-prompt-studio-mvp.md. Until enabled, requests return a clear not-ready response.",
};

export default function StudioPage() {
  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h1 className="text-2xl font-semibold text-text-primary tracking-tight">
            {copy.title}
          </h1>
          <Badge variant="warm-gray">{copy.badge}</Badge>
        </div>
        <p className="mt-2 text-sm text-text-tertiary leading-relaxed max-w-2xl">
          {copy.intro}
        </p>
        <ul className="mt-4 space-y-2 text-sm text-text-secondary list-disc pl-5 max-w-2xl">
          {copy.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <Card className="border-border-subtle mb-8">
        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[200px] text-center border border-dashed border-border-subtle rounded-none bg-layer-02/50">
          <Sparkles className="h-10 w-10 text-primary mb-4" aria-hidden />
          <p className="text-sm font-medium text-text-primary">
            Building in public
          </p>
          <p className="mt-2 text-xs text-text-tertiary max-w-md leading-relaxed">
            {copy.note}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <ButtonLink href="/dashboard/library" variant="primary" size="lg">
          <BookOpen className="h-4 w-4 shrink-0" />
          {copy.ctaLibrary}
        </ButtonLink>
        <ButtonLink href="/dashboard/billing" variant="tertiary" size="lg">
          <CreditCard className="h-4 w-4 shrink-0" />
          {copy.ctaBilling}
        </ButtonLink>
      </div>
    </div>
  );
}
