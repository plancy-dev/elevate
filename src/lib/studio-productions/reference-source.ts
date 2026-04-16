/**
 * Reference source pipeline: extract transcripts from YouTube URLs or raw text,
 * fetch open-web URLs (metadata + Readability body), accept manual notes,
 * then translate/summarize/remix into structured scripts.
 */

export type ReferenceSourceType =
  | "youtube_url"
  | "web_url"
  | "text"
  | "manual_note";

export type ReferenceSource = {
  type: ReferenceSourceType;
  value: string;
  label?: string;
};

export type ExtractedTranscript = {
  sourceType: ReferenceSourceType;
  sourceLabel: string;
  language: string;
  transcript: string;
};

export type YoutubeExtractOutcome =
  | { ok: true; transcript: ExtractedTranscript }
  | { ok: false; code: "tool_missing" | "failed" };

function isProbablyMissingYtDlp(e: unknown): boolean {
  const err = e as NodeJS.ErrnoException & { message?: string };
  if (err?.code === "ENOENT") return true;
  const m = String(err?.message ?? e);
  return /yt-dlp|ffmpeg|not found|ENOENT|spawn/i.test(m);
}

/**
 * Extract audio from a YouTube URL using yt-dlp and transcribe with Whisper.
 * Requires yt-dlp and ffmpeg on the server (not available on typical serverless/edge runtimes).
 */
export async function extractTranscriptFromYouTube(
  url: string,
  whisperApiKey: string,
): Promise<YoutubeExtractOutcome> {
  const { execSync } = await import("child_process");
  const { readFileSync, unlinkSync, existsSync } = await import("fs");
  const { join } = await import("path");
  const { tmpdir } = await import("os");

  const tmpAudio = join(tmpdir(), `elevate-yt-${Date.now()}.mp3`);

  try {
    try {
      execSync(
        `yt-dlp -x --audio-format mp3 --audio-quality 5 -o "${tmpAudio}" "${url}"`,
        { timeout: 120_000, stdio: "pipe" },
      );
    } catch (e) {
      if (isProbablyMissingYtDlp(e)) return { ok: false, code: "tool_missing" };
      return { ok: false, code: "failed" };
    }

    if (!existsSync(tmpAudio)) return { ok: false, code: "failed" };

    const audioBuffer = readFileSync(tmpAudio);
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([audioBuffer], { type: "audio/mpeg" }),
      "audio.mp3",
    );
    formData.append("model", "whisper-1");
    formData.append("response_format", "text");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${whisperApiKey}` },
      body: formData,
    });

    if (!res.ok) return { ok: false, code: "failed" };

    const transcript = await res.text();

    return {
      ok: true,
      transcript: {
        sourceType: "youtube_url",
        sourceLabel: url,
        language: "auto",
        transcript: transcript.trim(),
      },
    };
  } catch {
    return { ok: false, code: "failed" };
  } finally {
    try {
      unlinkSync(tmpAudio);
    } catch {
      /* cleanup best-effort */
    }
  }
}

/**
 * Wrap raw text input as an extracted transcript.
 */
export function wrapTextAsTranscript(text: string, label?: string): ExtractedTranscript {
  return {
    sourceType: "text",
    sourceLabel: label?.trim() || "Direct text input",
    language: "auto",
    transcript: text.trim(),
  };
}

/**
 * User-authored interpretation, summary, or commentary (no automatic extraction).
 */
export function wrapManualNoteAsTranscript(text: string, label?: string): ExtractedTranscript {
  return {
    sourceType: "manual_note",
    sourceLabel: label?.trim() || "Personal note",
    language: "auto",
    transcript: text.trim(),
  };
}

export type ScriptAdaptationMode =
  | "translate"
  | "summarize"
  | "remix"
  | "book_review_short"
  | "book_review_long"
  | "storytelling_animation"
  | "news_summary";

const SOURCE_TYPE_HINT: Partial<Record<ReferenceSourceType, string>> = {
  manual_note:
    " (author’s own summary, interpretation, or commentary — weight appropriately vs verbatim sources)",
  web_url: " (fetched web page text and metadata)",
};

/**
 * Build a prompt for the LLM to translate/adapt/remix transcripts into a structured script.
 */
export function buildReferenceAdaptPrompt(
  transcripts: ExtractedTranscript[],
  mode: ScriptAdaptationMode,
  targetLanguage: string,
  additionalInstructions?: string,
): string {
  const sourceBlock = transcripts
    .map((t, i) => {
      const hint = SOURCE_TYPE_HINT[t.sourceType] ?? "";
      return `--- Source ${i + 1} (${t.sourceType}: ${t.sourceLabel})${hint} ---\n${t.transcript}`;
    })
    .join("\n\n");

  const modeInstructions: Record<ScriptAdaptationMode, string> = {
    translate:
      `Translate the source transcript(s) into ${targetLanguage}. Preserve meaning and tone. ` +
      `Adapt cultural references for the target audience. Output a flowing narrative script.`,
    summarize:
      `Summarize the key points from the source transcript(s) into a concise ${targetLanguage} script. ` +
      `Focus on the most impactful insights. Target 60-90 seconds of narration.`,
    remix:
      `Combine and remix the source transcript(s) into a fresh, engaging ${targetLanguage} script. ` +
      `Create a new narrative arc that synthesizes the best ideas from all sources. ` +
      `The result should feel original, not a simple concatenation.`,
    book_review_short:
      `Based on the source text (book summary/review), create a compelling 40-60 second ${targetLanguage} script ` +
      `for a YouTube Shorts video. End with a book recommendation CTA. ` +
      `Hook the viewer in the first 3 seconds with a provocative insight from the book.`,
    book_review_long:
      `Based on the source text (book summary/review), create a 5-10 minute ${targetLanguage} script ` +
      `for a long-form YouTube video. Structure: hook -> key insights (3-5) -> personal reflection -> recommendation CTA. ` +
      `Make each section visually describable for animation.`,
    storytelling_animation:
      `Transform the source material into an entertaining, story-driven ${targetLanguage} script ` +
      `designed for animated narration. Use dramatic structure: setup -> conflict -> resolution. ` +
      `Make it engaging and slightly provocative to capture attention. Include visual cues in [brackets].`,
    news_summary:
      `Summarize the source material into a news-style ${targetLanguage} script. ` +
      `Lead with the most important finding. Use clear, authoritative language. ` +
      `Target 60-90 seconds. End with implications or what to watch for next.`,
  };

  const lines = [
    "You are an expert content adapter. Your task is to transform source transcripts into a polished script.",
    "",
    `Mode: ${mode.toUpperCase()}`,
    modeInstructions[mode],
    "",
    "SOURCE TRANSCRIPTS:",
    sourceBlock,
    "",
  ];

  if (additionalInstructions) {
    lines.push(
      "ADDITIONAL INSTRUCTIONS (highest priority):",
      additionalInstructions,
      "",
    );
  }

  lines.push(
    "OUTPUT: Respond with a JSON object containing exactly these keys:",
    '  { "hook": "...", "title": "...", "script_draft": "..." }',
    "hook: The first 1-2 sentences to grab attention.",
    "title: A compelling title for the final video.",
    "script_draft: The complete narration script.",
    "Respond ONLY with valid JSON. No markdown, no explanation.",
  );

  return lines.join("\n");
}
