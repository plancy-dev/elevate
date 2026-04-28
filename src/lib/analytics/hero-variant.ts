export const HERO_VARIANT_COOKIE = "elevate_hero_variant";
export const HERO_VARIANT_SOURCE_COOKIE = "elevate_hero_variant_source";

export type HeroVariant = "A" | "B";
export type HeroVariantSource = "query" | "cookie" | "random";

export function parseHeroVariant(value: string | null | undefined): HeroVariant | null {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === "A" || normalized === "B") return normalized;
  return null;
}

export function parseHeroVariantSource(
  value: string | null | undefined,
): HeroVariantSource | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "query" || normalized === "cookie" || normalized === "random") {
    return normalized;
  }
  return null;
}

export function pickHeroVariant(): HeroVariant {
  return Math.random() < 0.5 ? "A" : "B";
}

