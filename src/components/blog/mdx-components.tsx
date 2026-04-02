import type { ComponentPropsWithoutRef } from "react";

/**
 * Prose mapping for MDX under marketing layout (server-rendered).
 */
export const blogMdxComponents = {
  h1: (props: ComponentPropsWithoutRef<"h1">) => (
    <h1
      className="mt-8 first:mt-0 text-2xl font-semibold tracking-tight text-text-primary"
      {...props}
    />
  ),
  h2: (props: ComponentPropsWithoutRef<"h2">) => (
    <h2
      className="mt-10 text-xl font-semibold tracking-tight text-text-primary border-b border-border-subtle pb-2"
      {...props}
    />
  ),
  h3: (props: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mt-8 text-lg font-medium text-text-primary" {...props} />
  ),
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="mt-4 text-sm leading-relaxed text-text-secondary" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-4 list-disc pl-5 text-sm text-text-secondary space-y-2" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="mt-4 list-decimal pl-5 text-sm text-text-secondary space-y-2" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => (
    <li className="leading-relaxed" {...props} />
  ),
  a: (props: ComponentPropsWithoutRef<"a">) => (
    <a
      className="text-interactive font-medium underline-offset-2 hover:underline"
      {...props}
    />
  ),
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code
      className="rounded-sm bg-layer-02 px-1.5 py-0.5 text-[13px] font-mono text-text-primary"
      {...props}
    />
  ),
  pre: (props: ComponentPropsWithoutRef<"pre">) => (
    <pre
      className="mt-4 overflow-x-auto rounded-sm border border-border-subtle bg-layer-01 p-4 text-[13px] font-mono text-text-primary"
      {...props}
    />
  ),
  blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="mt-4 border-l-2 border-primary pl-4 text-sm italic text-text-secondary"
      {...props}
    />
  ),
  hr: (props: ComponentPropsWithoutRef<"hr">) => (
    <hr className="my-10 border-border-subtle" {...props} />
  ),
};
