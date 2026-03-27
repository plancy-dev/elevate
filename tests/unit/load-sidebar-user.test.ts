import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { loadSidebarUser } from "@/lib/dashboard/load-sidebar-user";

type ProfileRow = {
  display_name: string | null;
  role: string;
  organization_id: string | null;
};

function createChainableMock(handlers: {
  profiles: () => Promise<{ data: ProfileRow | null; error: null }>;
  organizations: () => Promise<{ data: { name: string } | null; error: null }>;
}): SupabaseClient {
  return {
    from(table: string) {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => {
              if (table === "profiles") return handlers.profiles();
              if (table === "organizations") return handlers.organizations();
              return Promise.resolve({ data: null, error: null });
            },
          }),
        }),
      };
    },
  } as unknown as SupabaseClient;
}

function baseUser(overrides: Partial<User> = {}): User {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    email: "jane@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    ...overrides,
  } as User;
}

describe("loadSidebarUser", () => {
  it("builds sidebar from profile and organization", async () => {
    const supabase = createChainableMock({
      profiles: async () => ({
        data: {
          display_name: "Jane Doe",
          role: "admin",
          organization_id: "org-uuid",
        },
        error: null,
      }),
      organizations: async () => ({
        data: { name: "Acme Corp" },
        error: null,
      }),
    });

    const result = await loadSidebarUser(supabase, baseUser());

    expect(result).toEqual({
      displayName: "Jane Doe",
      email: "jane@example.com",
      roleLabel: "Admin",
      orgName: "Acme Corp",
      initials: "JD",
    });
  });

  it("falls back to email local-part when display name is empty", async () => {
    const supabase = createChainableMock({
      profiles: async () => ({
        data: {
          display_name: "",
          role: "viewer",
          organization_id: null,
        },
        error: null,
      }),
      organizations: async () => ({ data: null, error: null }),
    });

    const result = await loadSidebarUser(supabase, baseUser({ email: "bob@example.com" }));

    expect(result.displayName).toBe("bob");
    expect(result.orgName).toBe("—");
    expect(result.initials).toBe("BO");
  });

  it("does not query organizations when profile has no organization_id", async () => {
    let orgCalls = 0;
    const supabase = createChainableMock({
      profiles: async () => ({
        data: {
          display_name: "Solo",
          role: "viewer",
          organization_id: null,
        },
        error: null,
      }),
      organizations: async () => {
        orgCalls += 1;
        return { data: null, error: null };
      },
    });

    await loadSidebarUser(supabase, baseUser());

    expect(orgCalls).toBe(0);
  });
});
