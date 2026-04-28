import type { ComponentPropsWithoutRef } from "react";

/**
 * Prose mapping for MDX under marketing layout (server-rendered).
 */
export const blogMdxComponents = {
  h1: (props: ComponentPropsWithoutRef<"h1">) => (
    <h1
      className="mt-8 first:mt-0 font-semibold tracking-tight text-ink-900 text-[length:var(--elevate-prose-mdx-h1-size)] leading-snug"
      {...props}
    />
  ),
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2
      className="mt-10 border-b border-ink-100 pb-2 font-semibold tracking-tight text-ink-900 text-[length:var(--elevate-prose-mdx-h2-size)] leading-snug"
      {...props}
    />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3
      className="mt-8 font-medium text-ink-900 text-[length:var(--elevate-prose-mdx-h3-size)] leading-snug"
      {...props}
    />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p
      className="mt-4 text-[1em] leading-[var(--elevate-prose-body-leading)] text-ink-700"
      {...props}
    />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-4 list-disc space-y-2 pl-5 text-[1em] text-ink-700" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="mt-4 list-decimal space-y-2 pl-5 text-[1em] text-ink-700" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => (
    <li className="leading-relaxed" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a
      className="text-vermilion-600 font-medium underline-offset-2 hover:underline"
      {...props}
    />
  ),
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code
      className="rounded-[var(--radius-1)] bg-paper-50 px-1.5 py-0.5 text-[13px] font-mono text-ink-900"
      {...props}
    />
  ),
  pre: (props: ComponentPropsWithoutRef<"pre">) => (
    <pre
      className="mt-4 overflow-x-auto rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 p-4 text-[13px] font-mono text-ink-900"
      {...props}
    />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="mt-4 border-l-2 border-primary pl-4 text-[1em] italic leading-[var(--elevate-prose-body-leading)] text-ink-700"
      {...props}
    />
  ),
  hr: (props: ComponentPropsWithoutRef<"hr">) => (
    <hr className="my-10 border-ink-100" {...props} />
  ),
  img: ({ alt, ...rest }: ComponentPropsWithoutRef<"img">) => (
    // eslint-disable-next-line @next/next/no-img-element -- MDX uses /public or allowed remote hero URLs
    <img
      alt={alt ?? ""}
      className="mt-6 w-full max-w-full rounded-[var(--radius-1)] border border-ink-100 object-cover"
      loading="lazy"
      decoding="async"
      {...rest}
    />
  ),
};
