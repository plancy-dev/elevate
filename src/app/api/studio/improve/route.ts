import { NextResponse } from "next/server";

/**
 * Prompt Studio — improvement endpoint (MVP scaffold).
 * Full LLM integration, auth, and rate limits: see docs/adr/ADR-002-prompt-studio-mvp.md
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "STUDIO_MVP_NOT_ENABLED",
      message:
        "Prompt improvement is not enabled in this deployment. Configure provider keys and enable per ADR-002.",
    },
    { status: 503 },
  );
}
