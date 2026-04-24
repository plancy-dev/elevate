import { describe, expect, it } from "vitest";
import {
  isCharacterBibleEmpty,
  parseCharacterBible,
  parseCharacterBibleFromFormData,
  serializeCharacterBible,
} from "@/lib/studio-productions/character-bible";

describe("parseCharacterBible", () => {
  it("returns empty object for null / malformed input", () => {
    expect(parseCharacterBible(null)).toEqual({});
    expect(parseCharacterBible(undefined)).toEqual({});
    expect(parseCharacterBible("not-json" as never)).toEqual({});
  });

  it("coerces numeric age but keeps freeform strings", () => {
    expect(parseCharacterBible({ age: 28 } as never).age).toBe(28);
    expect(parseCharacterBible({ age: "late twenties" } as never).age).toBe(
      "late twenties",
    );
  });

  it("normalizes nested appearance and extras", () => {
    const bible = parseCharacterBible({
      name: " Aria ",
      appearance: { hair: " black ", eyes: "", skin: "beige" },
      extras: { glasses: "silver", empty: "" },
    } as never);
    expect(bible.name).toBe("Aria");
    expect(bible.appearance?.hair).toBe("black");
    expect(bible.appearance?.eyes).toBeUndefined();
    expect(bible.extras).toEqual({ glasses: "silver" });
  });
});

describe("serializeCharacterBible", () => {
  it("round-trips through parse", () => {
    const input = {
      name: "Aria",
      age: 28,
      wardrobe: "beige knit",
      color_palette: { primary: "#f4a89c" },
    };
    const roundTrip = parseCharacterBible(serializeCharacterBible(input));
    expect(roundTrip).toEqual(input);
  });

  it("drops empty palette and extras", () => {
    const json = serializeCharacterBible({ name: "A", color_palette: {}, extras: {} });
    expect(json).toEqual({ name: "A" });
  });
});

describe("isCharacterBibleEmpty", () => {
  it("recognizes an empty bible", () => {
    expect(isCharacterBibleEmpty({})).toBe(true);
    expect(isCharacterBibleEmpty({ name: "A" })).toBe(false);
    expect(isCharacterBibleEmpty({ wardrobe: "X" })).toBe(false);
  });
});

describe("parseCharacterBibleFromFormData", () => {
  it("reads bible_* fields and extras pairs", () => {
    const fd = new FormData();
    fd.set("bible_name", "Aria");
    fd.set("bible_age", "28");
    fd.set("bible_hair", "black");
    fd.append("bible_extras_key[]", "glasses");
    fd.append("bible_extras_value[]", "silver");
    fd.append("bible_extras_key[]", "emptyKey");
    fd.append("bible_extras_value[]", "");
    const bible = parseCharacterBibleFromFormData(fd);
    expect(bible.name).toBe("Aria");
    expect(bible.age).toBe(28);
    expect(bible.appearance?.hair).toBe("black");
    expect(bible.extras).toEqual({ glasses: "silver" });
  });
});
