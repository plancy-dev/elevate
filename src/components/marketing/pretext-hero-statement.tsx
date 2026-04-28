"use client";

import { layout, prepare } from "@chenglou/pretext";
import { useLayoutEffect, useRef, useState } from "react";

type Props = {
  line1: string;
  line2: string;
  sub: string;
  /**
   * `marketing`: first line uses ink primary (hero CTAs carry orange — V2 one-accent band).
   * `default`: first line uses product primary blue.
   */
  variant?: "default" | "marketing";
};

/**
 * Uses Pretext to align min-height with wrapped text (resize-safe).
 * Motion: CSS fade/slide on the block (separate from Pretext measurement).
 */
export function PretextHeroStatement({
  line1,
  line2,
  sub,
  variant = "default",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);

  const text = `${line1}\n${line2}`;

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const probe = probeRef.current;
    if (!wrap || !probe) return;

    const run = () => {
      const cs = getComputedStyle(probe);
      const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const lhRaw = cs.lineHeight;
      const lineHeight =
        lhRaw === "normal" ? parseFloat(cs.fontSize) * 1.15 : parseFloat(lhRaw);
      const prepared = prepare(text, font, { whiteSpace: "pre-wrap" });
      const w = wrap.clientWidth;
      if (w <= 0) return;
      const { height } = layout(prepared, w, lineHeight);
      setMinHeight(height);
    };

    run();
    const ro = new ResizeObserver(run);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div className="mt-8 max-w-lg">
      <span
        ref={probeRef}
        className="pointer-events-none absolute -z-10 opacity-0 text-[length:var(--elevate-pretext-hero-line-size)] font-semibold tracking-[-0.02em] leading-[1.15] whitespace-pre-wrap"
        aria-hidden
      >
        {text}
      </span>
      <div ref={wrapRef}>
        <div
          className="elevate-pretext-hero-animate text-[length:var(--elevate-pretext-hero-line-size)] font-semibold tracking-[-0.02em] leading-[1.15] text-ink-900 whitespace-pre-wrap"
          style={minHeight ? { minHeight } : undefined}
        >
          <span
            className={
              variant === "marketing" ? "text-ink-900" : "text-vermilion-600"
            }
          >
            {line1}
          </span>
          {"\n"}
          <span className="text-ink-700">{line2}</span>
        </div>
      </div>
      <p className="mt-4 text-[length:var(--elevate-prose-body-size)] leading-[var(--elevate-prose-body-leading)] text-ink-500">
        {sub}
      </p>
    </div>
  );
}
