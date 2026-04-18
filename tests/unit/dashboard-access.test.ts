import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { canUseDashboard } from "@/lib/auth/dashboard-access";

function profileChain(row: {
  dashboard_access: boolean | null;
  role: string | null;
} | null) {
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({
          data:
            row === null
              ? null
              : {
                  dashboard_access: row.dashboard_access,
                  role: row.role,
                },
          error: null,
        }),
      }),
    }),
  };
}

describe("dashboard-access", () => {
  afterEach(() => {
    vi.mocked(createAdminClient).mockReset();
  });

  it("denies when user id is missing", async () => {
    await expect(canUseDashboard("a@b.com", "admin")).resolves.toBe(false);
    await expect(canUseDashboard("a@b.com", "admin", "")).resolves.toBe(false);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("allows when profiles.dashboard_access is true", async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: (table: string) => {
        expect(table).toBe("profiles");
        return profileChain({ dashboard_access: true, role: "viewer" });
      },
    } as unknown as ReturnType<typeof createAdminClient>);

    await expect(
      canUseDashboard("u@co.com", "viewer", "00000000-0000-4000-8000-000000000001"),
    ).resolves.toBe(true);
  });

  it("allows when profiles.role is admin even if dashboard_access is false", async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: () => profileChain({ dashboard_access: false, role: "admin" }),
    } as unknown as ReturnType<typeof createAdminClient>);

    await expect(
      canUseDashboard("u@co.com", "admin", "00000000-0000-4000-8000-000000000001"),
    ).resolves.toBe(true);
  });

  it("denies when dashboard_access is false and role is not admin", async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: () => profileChain({ dashboard_access: false, role: "viewer" }),
    } as unknown as ReturnType<typeof createAdminClient>);

    await expect(
      canUseDashboard("u@co.com", "viewer", "00000000-0000-4000-8000-000000000001"),
    ).resolves.toBe(false);
  });

  it("denies when profile row is missing", async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: () => profileChain(null),
    } as unknown as ReturnType<typeof createAdminClient>);

    await expect(
      canUseDashboard("u@co.com", "admin", "00000000-0000-4000-8000-000000000001"),
    ).resolves.toBe(false);
  });

  it("denies when service role client cannot be created", async () => {
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
    });
    await expect(
      canUseDashboard("u@co.com", "admin", "00000000-0000-4000-8000-000000000001"),
    ).resolves.toBe(false);
  });

  it("allows admin when dashboard_access column is missing (fallback role-only select)", async () => {
    let maybeSingleCalls = 0;
    vi.mocked(createAdminClient).mockReturnValue({
      from: () => ({
        select: (cols: string) => {
          if (cols.includes("dashboard_access")) {
            return {
              eq: () => ({
                maybeSingle: async () => {
                  maybeSingleCalls += 1;
                  return {
                    data: null,
                    error: {
                      message:
                        "column profiles.dashboard_access does not exist in schema cache",
                    },
                  };
                },
              }),
            };
          }
          return {
            eq: () => ({
              maybeSingle: async () => {
                maybeSingleCalls += 1;
                return { data: { role: "admin" }, error: null };
              },
            }),
          };
        },
      }),
    } as unknown as ReturnType<typeof createAdminClient>);

    await expect(
      canUseDashboard("u@co.com", "admin", "00000000-0000-4000-8000-000000000001"),
    ).resolves.toBe(true);
    expect(maybeSingleCalls).toBe(2);
  });
});
