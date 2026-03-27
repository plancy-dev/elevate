import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertPublicSupabaseEnv,
  assertSupabaseProjectUrl,
  getPublicSupabaseEnv,
} from "@/lib/env/public";

describe("getPublicSupabaseEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    expect(getPublicSupabaseEnv()).toBeNull();
  });

  it("returns null when anon key is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(getPublicSupabaseEnv()).toBeNull();
  });

  it("returns both when set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJ");
    expect(getPublicSupabaseEnv()).toEqual({
      url: "https://x.supabase.co",
      anonKey: "eyJhbGciOiJ",
    });
  });
});

describe("assertPublicSupabaseEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws with a helpful message when vars are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(() => assertPublicSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE/);
  });
});

describe("assertSupabaseProjectUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect(() => assertSupabaseProjectUrl()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
