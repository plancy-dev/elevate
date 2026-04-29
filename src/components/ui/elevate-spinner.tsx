"use client";

import { cn } from "@/lib/utils";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  DEFAULT_SPINNER_TEMPO,
  type SpinnerTempoPreference,
} from "@/lib/settings-validation";

export type ElevateSpinnerSize = "sm" | "md" | "lg";
export type ElevateSpinnerVariant = "primary" | "muted";
export type ElevateSpinnerTempo = SpinnerTempoPreference;

export type ElevateSpinnerProps = HTMLAttributes<HTMLDivElement> & {
  size?: ElevateSpinnerSize;
  variant?: ElevateSpinnerVariant;
  label?: string;
  announce?: boolean;
  forceMotion?: boolean;
  tempo?: ElevateSpinnerTempo;
};

declare global {
  interface Window {
    __ELEVATE_SPINNER_DEBUG__?: boolean;
    __ELEVATE_SPINNER_STATE__?: {
      mounted: number;
      lastFrame: string;
      ticks: number;
      reduced: boolean;
      forceMotion: boolean;
      tempo: ElevateSpinnerTempo;
    };
  }
}

const sizeClassName: Record<ElevateSpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-9 w-9",
  lg: "h-12 w-12",
};

const variantClassName: Record<ElevateSpinnerVariant, { tone: string }> = {
  primary: {
    tone: "text-primary",
  },
  muted: {
    tone: "text-ink-700",
  },
};

const ElevateSpinnerTempoContext = createContext<ElevateSpinnerTempo>(DEFAULT_SPINNER_TEMPO);

export function ElevateSpinnerTempoProvider({
  tempo,
  children,
}: {
  tempo: ElevateSpinnerTempo;
  children: ReactNode;
}) {
  return (
    <ElevateSpinnerTempoContext.Provider value={tempo}>
      {children}
    </ElevateSpinnerTempoContext.Provider>
  );
}

const spinnerTempoPreset: Record<
  ElevateSpinnerTempo,
  {
    sequence: ReadonlyArray<ReadonlyArray<number>>;
    intervalMs: number;
    riseFactor: number;
    baseY: number;
    baseScale: number;
    scaleFactor: number;
  }
> = {
  calm: {
    sequence: [
      [1, 0.26, 0.16],
      [0.88, 0.52, 0.2],
      [0.64, 1, 0.32],
      [0.32, 0.82, 0.64],
      [0.2, 0.56, 1],
      [0.16, 0.34, 0.78],
      [0.14, 0.2, 0.42],
      [0.14, 0.14, 0.22],
    ],
    intervalMs: 135,
    riseFactor: 22,
    baseY: 8,
    baseScale: 0.82,
    scaleFactor: 0.3,
  },
  lively: {
    sequence: [
      [1, 0.22, 0.14],
      [0.9, 0.56, 0.2],
      [0.66, 1, 0.34],
      [0.34, 0.86, 0.72],
      [0.18, 0.54, 1],
      [0.14, 0.3, 0.78],
      [0.14, 0.18, 0.44],
      [0.14, 0.14, 0.22],
    ],
    intervalMs: 110,
    riseFactor: 26,
    baseY: 8,
    baseScale: 0.78,
    scaleFactor: 0.38,
  },
};

export function ElevateSpinner({
  size = "md",
  variant = "primary",
  label = "Loading",
  announce = true,
  forceMotion = false,
  tempo,
  className,
  ...props
}: ElevateSpinnerProps) {
  const v = variantClassName[variant];
  const defaultTempo = useContext(ElevateSpinnerTempoContext);
  const resolvedTempo = tempo ?? defaultTempo;
  const tempoPreset = spinnerTempoPreset[resolvedTempo];
  const stepRefs = useRef<Array<SVGRectElement | null>>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | null = null;
    let frame = 0;

    const applyMotion = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
      const steps = stepRefs.current.filter((step): step is SVGRectElement => Boolean(step));
      if (!steps.length) return;

      if (mediaQuery.matches && !forceMotion) {
        for (const [index, step] of steps.entries()) {
          step.style.opacity = index === 0 ? "0.45" : index === 1 ? "0.7" : "1";
          step.style.transform = "none";
        }
        if (containerRef.current) {
          containerRef.current.dataset.elevateSpinnerFrame = "reduced";
        }
        if (process.env.NODE_ENV !== "production") {
          window.__ELEVATE_SPINNER_STATE__ = {
            mounted: 1,
            lastFrame: "reduced",
            ticks: 0,
            reduced: true,
            forceMotion,
            tempo: resolvedTempo,
          };
        }
        return;
      }

      const renderFrame = (nextFrame: number) => {
        const phase = tempoPreset.sequence[nextFrame % tempoPreset.sequence.length];
        for (const [index, step] of steps.entries()) {
          const intensity = phase[index] ?? 0.14;
          step.style.opacity = `${intensity}`;
          const translateY = tempoPreset.baseY - intensity * tempoPreset.riseFactor;
          const scale = tempoPreset.baseScale + intensity * tempoPreset.scaleFactor;
          step.style.transform = `translateY(${translateY}%) scale(${scale})`;
        }
        if (containerRef.current) {
          containerRef.current.dataset.elevateSpinnerFrame = String(
            nextFrame % tempoPreset.sequence.length,
          );
          containerRef.current.dataset.elevateSpinnerTempo = resolvedTempo;
        }
        if (process.env.NODE_ENV !== "production") {
          window.__ELEVATE_SPINNER_STATE__ = {
            mounted: 1,
            lastFrame: String(nextFrame % tempoPreset.sequence.length),
            ticks: nextFrame,
            reduced: false,
            forceMotion,
            tempo: resolvedTempo,
          };
          if (window.__ELEVATE_SPINNER_DEBUG__) {
            console.debug("[ElevateSpinner]", window.__ELEVATE_SPINNER_STATE__);
          }
        }
      };

      renderFrame(frame);
      timer = window.setInterval(() => {
        frame += 1;
        renderFrame(frame);
      }, tempoPreset.intervalMs);
    };

    applyMotion();

    const onMotionChange = () => applyMotion();
    mediaQuery.addEventListener("change", onMotionChange);

    return () => {
      mediaQuery.removeEventListener("change", onMotionChange);
      if (timer) {
        window.clearInterval(timer);
      }
      if (process.env.NODE_ENV !== "production") {
        window.__ELEVATE_SPINNER_STATE__ = {
          mounted: 0,
          lastFrame: "unmounted",
          ticks: frame,
          reduced: mediaQuery.matches,
          forceMotion,
          tempo: resolvedTempo,
        };
      }
    };
  }, [forceMotion, resolvedTempo, tempoPreset]);

  return (
    <div
      ref={containerRef}
      role={announce ? "status" : undefined}
      aria-label={announce ? label : undefined}
      aria-hidden={announce ? undefined : true}
      data-elevate-spinner="elevate-progressive"
      data-elevate-spinner-tempo={resolvedTempo}
      className={cn(
        "relative inline-flex items-end justify-start",
        sizeClassName[size],
        className,
      )}
      {...props}
    >
      <svg
        viewBox="0 0 40 40"
        aria-hidden="true"
        className={cn("h-full w-full", v.tone)}
      >
        <rect
          ref={(node) => {
            stepRefs.current[0] = node;
          }}
          x="2"
          y="24"
          width="12"
          height="12"
          rx="2"
          className="fill-current"
          style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
        />
        <rect
          ref={(node) => {
            stepRefs.current[1] = node;
          }}
          x="14"
          y="14"
          width="12"
          height="12"
          rx="2"
          className="fill-current"
          style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
        />
        <rect
          ref={(node) => {
            stepRefs.current[2] = node;
          }}
          x="26"
          y="4"
          width="12"
          height="12"
          rx="2"
          className="fill-current"
          style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
        />
      </svg>
    </div>
  );
}
