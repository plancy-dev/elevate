/**
 * Long-form marketing detail: shell + H1, lead, repeating H2 + body (aligned with blog/article tokens).
 * Section bodies may use double newlines for paragraphs.
 */
export function MarketingArticle({
  title,
  lead,
  sections,
}: {
  title: string;
  lead: string;
  sections: { title: string; body: string }[];
}) {
  return (
    <div className="elevate-marketing-shell py-12 sm:py-16 lg:py-20">
      <article className="mx-auto max-w-[min(45rem,100%)]">
        <h1 className="text-[length:var(--elevate-marketing-page-title-size)] font-semibold tracking-[-0.02em] leading-[1.12] text-text-primary">
          {title}
        </h1>
        <p className="mt-5 text-[length:var(--elevate-marketing-lead-size)] leading-[var(--elevate-prose-body-leading)] text-text-secondary">
          {lead}
        </p>
        <div className="mt-12 space-y-10 sm:mt-14 sm:space-y-12">
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className="border-b border-border-subtle pb-2 text-[length:var(--elevate-marketing-section-title-size)] font-semibold tracking-[-0.02em] text-text-primary">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4 text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-text-secondary">
                {section.body
                  .split(/\n\n+/)
                  .map((para) => para.trim())
                  .filter(Boolean)
                  .map((para, j) => (
                    <p key={j}>{para}</p>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
