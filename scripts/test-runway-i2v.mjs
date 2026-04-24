/**
 * One-off live test: Runway image-to-video with the keyframes we just
 * generated via Gemini. Bypasses the server action layer (which is
 * `server-only`) but reuses the same adapter and capability table.
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import RunwayML, { TaskFailedError, TaskTimedOutError } from "@runwayml/sdk";

config({ path: resolve(process.cwd(), ".env.local") });

const { createClient } = await import("@supabase/supabase-js");
const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { decryptProviderSecret } = await import(
  "../src/lib/studio-integrations/crypto.ts"
);

// 1. Look up Runway key
const { data: cred } = await supa
  .from("studio_org_provider_connections")
  .select("secret_ciphertext")
  .eq("provider", "runway")
  .single();
if (!cred) throw new Error("no runway key saved");
const runwayKey = decryptProviderSecret(cred.secret_ciphertext).trim();

// 2. Look up the first & last frame artifacts we just promoted
const { data: frames } = await supa
  .from("studio_production_artifacts")
  .select("id, artifact_role, external_url")
  .in("artifact_role", ["scene_keyframe_first", "scene_keyframe_last"]);
const first = frames.find((f) => f.artifact_role === "scene_keyframe_first");
const last = frames.find((f) => f.artifact_role === "scene_keyframe_last");
console.log("first:", first?.external_url);
console.log("last: ", last?.external_url);
if (!first || !last) throw new Error("need both first + last promoted");

// 3. Build the I2V call. Use veo3.1 (supports last frame).
const client = new RunwayML({
  apiKey: runwayKey,
  runwayVersion: "2024-11-06",
  maxRetries: 1,
});

const promptText = [
  "Subject: Aria Chen, East Asian, shoulder-length black hair, minimalist beige knit, dark jeans, cinematic style.",
  "A dreamy pastel-colored childhood bedroom at golden hour.",
  "Slow dolly-in on the child lying on the floor, the whimsical thought bubble drifts and intensifies.",
  "Cinematic, shallow depth of field. Natural lighting. Subtle motion. No on-image text.",
].join(" ");

console.log("prompt:", promptText);
console.log("about to call Runway imageToVideo (veo3.1, 4s)...");

const t0 = Date.now();
try {
  const succeeded = await client.imageToVideo
    .create({
      model: "veo3.1",
      promptImage: [
        { position: "first", uri: first.external_url },
        { position: "last", uri: last.external_url },
      ],
      promptText,
      ratio: "1080:1920",
      duration: 4,
    })
    .waitForTaskOutput({ timeout: 180_000 });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n[OK] ${elapsed}s task_id=${succeeded.id}`);
  console.log("output URLs:", succeeded.output);
} catch (err) {
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  if (err instanceof TaskFailedError) {
    console.error(`[FAIL] ${elapsed}s TaskFailedError:`, err.taskDetails);
  } else if (err instanceof TaskTimedOutError) {
    console.error(`[TIMEOUT] ${elapsed}s`);
  } else {
    console.error(`[ERROR] ${elapsed}s`, err.message || err);
  }
  process.exit(1);
}
