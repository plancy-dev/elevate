"use client";

import { useState } from "react";

export type MorningOpsTemplate = {
  id: string;
  title: string;
  body: string;
};

export function MorningOpsPlaybookClient({
  heading,
  templates,
  copyLabel,
  copiedLabel,
}: {
  heading: string;
  templates: MorningOpsTemplate[];
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function onCopy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <section className="space-y-3 border border-ink-100 bg-paper-0 p-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-ink-700">{heading}</h2>
      <div className="space-y-3">
        {templates.map((template) => (
          <article key={template.id} className="space-y-2 border border-ink-100 bg-paper-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xs font-medium text-ink-900">{template.title}</h3>
              <button
                type="button"
                onClick={() => void onCopy(template.id, template.body)}
                className="rounded-(--radius-1) border border-ink-100 bg-paper-0 px-2 py-1 text-xs text-ink-700 transition-colors hover:bg-paper-50 hover:text-ink-900"
              >
                {copiedId === template.id ? copiedLabel : copyLabel}
              </button>
            </div>
            <pre className="whitespace-pre-wrap border border-ink-100 bg-paper-0 p-3 text-[11px] leading-relaxed text-ink-800">
              {template.body}
            </pre>
          </article>
        ))}
      </div>
    </section>
  );
}

