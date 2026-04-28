type RuleProps = {
  orientation?: "vertical" | "horizontal";
  className?: string;
};

export function Rule({ orientation = "vertical", className }: RuleProps) {
  if (orientation === "horizontal") {
    return <div className={["h-px w-full bg-ink-100", className].filter(Boolean).join("")} aria-hidden />;
  }
  return <div className={["h-full w-px bg-ink-100", className].filter(Boolean).join("")} aria-hidden />;
}
