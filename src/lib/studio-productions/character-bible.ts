/**
 * Character Bible — hybrid JSONB schema for visual identity (ADR-009 §5).
 *
 * Stored on `studio_projects.character_bible` as JSONB. Recommended fixed
 * fields are typed below; anything else lives in `extras`. The parser is
 * tolerant: unknown/missing fields are ignored and `extras` is normalized to
 * an object.
 */
import type { Json } from "@/types/database.types";

export type CharacterColorPalette = {
  primary?: string;
  secondary?: string;
  accent?: string;
};

export type CharacterAppearance = {
  hair?: string;
  eyes?: string;
  skin?: string;
  ethnicity?: string;
};

export type CharacterBible = {
  name?: string;
  age?: number | string;
  appearance?: CharacterAppearance;
  wardrobe?: string;
  style?: string;
  color_palette?: CharacterColorPalette;
  extras?: Record<string, string>;
};

function parseObject(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  return input as Record<string, unknown>;
}

function parseStringOrUndef(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

function parseExtras(v: unknown): Record<string, string> | undefined {
  const obj = parseObject(v);
  if (!obj) return undefined;
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.trim() !== "") {
      out[key] = value.trim();
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Coerce a DB JSONB row into a typed Character Bible. Never throws; returns
 * an empty object when the input is null/empty/malformed.
 */
export function parseCharacterBible(raw: Json | null | undefined): CharacterBible {
  const obj = parseObject(raw);
  if (!obj) return {};

  const out: CharacterBible = {};
  const name = parseStringOrUndef(obj.name);
  if (name) out.name = name;

  if (typeof obj.age === "number" && Number.isFinite(obj.age)) {
    out.age = obj.age;
  } else {
    const ageStr = parseStringOrUndef(obj.age);
    if (ageStr) out.age = ageStr;
  }

  const app = parseObject(obj.appearance);
  if (app) {
    const appearance: CharacterAppearance = {};
    const hair = parseStringOrUndef(app.hair);
    if (hair) appearance.hair = hair;
    const eyes = parseStringOrUndef(app.eyes);
    if (eyes) appearance.eyes = eyes;
    const skin = parseStringOrUndef(app.skin);
    if (skin) appearance.skin = skin;
    const ethnicity = parseStringOrUndef(app.ethnicity);
    if (ethnicity) appearance.ethnicity = ethnicity;
    if (Object.keys(appearance).length > 0) out.appearance = appearance;
  }

  const wardrobe = parseStringOrUndef(obj.wardrobe);
  if (wardrobe) out.wardrobe = wardrobe;

  const style = parseStringOrUndef(obj.style);
  if (style) out.style = style;

  const palette = parseObject(obj.color_palette);
  if (palette) {
    const cp: CharacterColorPalette = {};
    const primary = parseStringOrUndef(palette.primary);
    if (primary) cp.primary = primary;
    const secondary = parseStringOrUndef(palette.secondary);
    if (secondary) cp.secondary = secondary;
    const accent = parseStringOrUndef(palette.accent);
    if (accent) cp.accent = accent;
    if (Object.keys(cp).length > 0) out.color_palette = cp;
  }

  const extras = parseExtras(obj.extras);
  if (extras) out.extras = extras;

  return out;
}

/** JSON-safe serialization for DB writes. */
export function serializeCharacterBible(bible: CharacterBible): Json {
  const json: Record<string, Json> = {};
  if (bible.name) json.name = bible.name;
  if (bible.age != null) {
    json.age = typeof bible.age === "number" ? bible.age : String(bible.age);
  }
  if (bible.appearance && Object.keys(bible.appearance).length > 0) {
    json.appearance = bible.appearance as unknown as Json;
  }
  if (bible.wardrobe) json.wardrobe = bible.wardrobe;
  if (bible.style) json.style = bible.style;
  if (bible.color_palette && Object.keys(bible.color_palette).length > 0) {
    json.color_palette = bible.color_palette as unknown as Json;
  }
  if (bible.extras && Object.keys(bible.extras).length > 0) {
    json.extras = bible.extras as unknown as Json;
  }
  return json;
}

/** True when the bible has at least one usable visual hint. */
export function isCharacterBibleEmpty(bible: CharacterBible): boolean {
  return (
    !bible.name &&
    bible.age == null &&
    !bible.appearance &&
    !bible.wardrobe &&
    !bible.style &&
    !bible.color_palette &&
    !bible.extras
  );
}

/**
 * Parse a FormData flat-field representation (used by the project edit form
 * where the bible is posted as `bible_*` fields) into a Character Bible.
 * Extras are posted as `bible_extras_<i>_key` / `_value` pairs.
 */
export function parseCharacterBibleFromFormData(
  formData: FormData,
): CharacterBible {
  const out: CharacterBible = {};
  const name = String(formData.get("bible_name") ?? "").trim();
  if (name) out.name = name;

  const age = String(formData.get("bible_age") ?? "").trim();
  if (age) {
    const num = Number(age);
    out.age = Number.isFinite(num) && age.match(/^\d+$/) ? num : age;
  }

  const appearance: CharacterAppearance = {};
  const hair = String(formData.get("bible_hair") ?? "").trim();
  if (hair) appearance.hair = hair;
  const eyes = String(formData.get("bible_eyes") ?? "").trim();
  if (eyes) appearance.eyes = eyes;
  const skin = String(formData.get("bible_skin") ?? "").trim();
  if (skin) appearance.skin = skin;
  const ethnicity = String(formData.get("bible_ethnicity") ?? "").trim();
  if (ethnicity) appearance.ethnicity = ethnicity;
  if (Object.keys(appearance).length > 0) out.appearance = appearance;

  const wardrobe = String(formData.get("bible_wardrobe") ?? "").trim();
  if (wardrobe) out.wardrobe = wardrobe;

  const style = String(formData.get("bible_style") ?? "").trim();
  if (style) out.style = style;

  const palette: CharacterColorPalette = {};
  const primary = String(formData.get("bible_color_primary") ?? "").trim();
  if (primary) palette.primary = primary;
  const secondary = String(formData.get("bible_color_secondary") ?? "").trim();
  if (secondary) palette.secondary = secondary;
  const accent = String(formData.get("bible_color_accent") ?? "").trim();
  if (accent) palette.accent = accent;
  if (Object.keys(palette).length > 0) out.color_palette = palette;

  const extras: Record<string, string> = {};
  // Extras are posted as repeatable `bible_extras_key[]` / `bible_extras_value[]`.
  const keys = formData.getAll("bible_extras_key[]").map((v) => String(v).trim());
  const values = formData
    .getAll("bible_extras_value[]")
    .map((v) => String(v).trim());
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    const v = values[i] ?? "";
    if (k && v) extras[k] = v;
  }
  if (Object.keys(extras).length > 0) out.extras = extras;

  return out;
}
