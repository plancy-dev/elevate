/**
 * Step4 one-click retry script:
 * Retry failed/pending Buffer scheduled posts for one episode.
 *
 * Usage:
 *   pnpm run buffer:retry-step4 -- --episode <episode-id>
 *
 * Requires:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - BUFFER_API_KEY
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });

const episodeId = readArg("--episode");
if (!episodeId) {
  console.error("Missing --episode <episode-id>");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const apiKey = (process.env.BUFFER_API_KEY ?? "").replace(/\s+/g, "").trim();

if (!supabaseUrl || !serviceRole) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!apiKey) {
  console.error("Missing BUFFER_API_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRole);

function readArg(flag) {
  const i = process.argv.indexOf(flag);
  if (i < 0) return "";
  return (process.argv[i + 1] ?? "").trim();
}

function resolveBufferGraphqlUrl() {
  const raw = process.env.BUFFER_API_URL?.trim();
  if (!raw) return "https://api.buffer.com/graphql";
  if (raw === "https://graph.buffer.com") return "https://api.buffer.com/graphql";
  return raw;
}

async function createBufferPost(input) {
  const res = await fetch(resolveBufferGraphqlUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: `
        mutation CreatePost($input: CreatePostInput!) {
          createPost(input: $input) {
            ... on PostActionSuccess {
              post { id status dueAt }
            }
            ... on MutationError { message }
          }
        }
      `,
      variables: { input },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, reason: `http_${res.status}: ${body.slice(0, 300)}` };
  }
  const body = await res.json().catch(() => ({}));
  const maybeErr = body?.errors?.[0]?.message;
  if (maybeErr) {
    return { ok: false, reason: String(maybeErr).slice(0, 300) };
  }
  const payload = body?.data?.createPost;
  if (!payload) return { ok: false, reason: "empty createPost payload" };
  if (payload.message && !payload.post?.id) {
    return { ok: false, reason: String(payload.message).slice(0, 300) };
  }
  if (!payload.post?.id) return { ok: false, reason: "missing post id" };
  return {
    ok: true,
    postId: payload.post.id,
    dueAt: payload.post.dueAt ?? null,
  };
}

async function run() {
  const { data: rows, error } = await supabase
    .from("studio_scheduled_posts")
    .select("*")
    .eq("episode_id", episodeId)
    .in("status", ["failed", "pending"])
    .lt("retry_count", 3)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`query failed: ${error.message}`);
  if (!rows || rows.length === 0) {
    console.log("No retryable rows for this episode.");
    return;
  }

  let success = 0;
  let fail = 0;
  for (const row of rows) {
    const result = await createBufferPost({
      channelId: row.buffer_channel_id,
      text: row.caption,
      schedulingType: "automatic",
      mode: "customScheduled",
      dueAt: row.scheduled_at,
      mediaUrls: [row.video_url],
    });
    const updatedAt = new Date().toISOString();
    if (result.ok) {
      success += 1;
      const { error: updateErr } = await supabase
        .from("studio_scheduled_posts")
        .update({
          status: "scheduled",
          buffer_post_id: result.postId,
          last_error: null,
          retry_count: row.retry_count + 1,
          updated_at: updatedAt,
        })
        .eq("id", row.id);
      if (updateErr) {
        fail += 1;
        success -= 1;
        console.error(`update failed for ${row.id}: ${updateErr.message}`);
      } else {
        console.log(`OK ${row.id} -> ${result.postId}`);
      }
      continue;
    }
    fail += 1;
    await supabase
      .from("studio_scheduled_posts")
      .update({
        status: "failed",
        last_error: result.reason,
        retry_count: row.retry_count + 1,
        updated_at: updatedAt,
      })
      .eq("id", row.id);
    console.error(`FAIL ${row.id}: ${result.reason}`);
  }

  console.log(
    JSON.stringify(
      {
        episodeId,
        total: rows.length,
        success,
        fail,
      },
      null,
      2,
    ),
  );

  // Non-zero when all failed so CI/cron can detect.
  if (success === 0 && fail > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

