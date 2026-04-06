import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockInsert } = vi.hoisted(() => ({
  mockInsert: vi.fn(),
}));

vi.mock("@/lib/platform/platform-email-settings", () => ({
  getWaitlistBccEmail: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/email/send-waitlist-confirmation-email", () => ({
  sendWaitlistConfirmationEmail: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockInsert,
    })),
  })),
}));

import { POST } from "@/app/api/waitlist/route";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockInsert.mockResolvedValue({ error: null });
  });

  it("returns 200 and inserts normalized email when valid", async () => {
    const res = await POST(
      jsonRequest({
        email: " User@Example.COM ",
        locale: "en",
        source: "band",
        website: "",
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok?: boolean };
    expect(body.ok).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith({
      email: "user@example.com",
      locale: "en",
      source: "band",
    });
  });

  it("returns 200 without insert when honeypot is filled", async () => {
    const res = await POST(
      jsonRequest({
        email: "a@b.co",
        website: "spam",
      }),
    );
    expect(res.status).toBe(200);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(jsonRequest({ locale: "en", website: "" }));
    expect(res.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 400 when email is invalid", async () => {
    const res = await POST(
      jsonRequest({ email: "not-an-email", website: "" }),
    );
    expect(res.status).toBe(400);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("returns 200 on duplicate email (23505)", async () => {
    mockInsert.mockResolvedValueOnce({
      error: { code: "23505", message: "duplicate" },
    });
    const res = await POST(
      jsonRequest({ email: "dup@example.com", website: "" }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok?: boolean };
    expect(body.ok).toBe(true);
  });

  it("defaults unknown source to home", async () => {
    await POST(
      jsonRequest({ email: "x@y.co", source: "not-a-real-source", website: "" }),
    );
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ source: "home" }),
    );
  });
});
