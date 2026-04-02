/**
 * Long-form marketing detail: H1, lead, and repeating H2 + body sections.
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
    <article className="mx-auto max-w-[720px] px-4 py-12 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-text-primary lg:text-4xl">
        {title}
      </h1>
      <p className="mt-5 text-base text-text-secondary leading-relaxed">{lead}</p>
      <div className="mt-12 space-y-12">
        {sections.map((section, i) => (
          <section key={i}>
            <h2 className="text-xl font-semibold tracking-tight text-text-primary border-b border-border-subtle pb-2">
              {section.title}
            </h2>
            <div className="mt-4 space-y-4 text-sm text-text-secondary leading-relaxed">
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
  );
}
