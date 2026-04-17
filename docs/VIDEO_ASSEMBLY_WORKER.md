# Video assembly worker (FFmpeg)

Production builds enqueue rows in `studio_video_assembly_jobs` (see migration `034_studio_video_assembly_jobs.sql`). A **separate Node process** polls Supabase, claims jobs via `claim_studio_video_assembly_job()`, runs the same `assembleVideo` pipeline as local dev, uploads the MP4 to the content storage bucket, and inserts the `assembled_video` artifact.

Vercel (Next.js) and this worker **do not call each other over HTTP**. They share the **same Supabase project** (Postgres + Storage). The dashboard enqueues jobs; the worker completes them. The episode pipeline listens for job row updates over **Supabase Realtime** (with slower polling as a fallback), so users do not need to keep the tab open—refreshing the episode page picks up completed artifacts from the server.

## Environment

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Same project as the app. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only; worker uses RPC + storage + inserts. |
| `CONTENT_STORAGE_BUCKET` | Yes | Same bucket name as Next.js; objects under `studio-assembled/...`. |
| `WORKER_POLL_IDLE_MS` | No | Idle delay when no job (default `2500`). |
| `PORT` | Fly.io only | Set automatically on Fly; enables `GET /health` for platform checks. |
| `VIDEO_ASSEMBLY_SUBTITLE_FONT` | No | libass `Fontname` for SRT burn-in (default `Noto Sans CJK KR`). Must match a font family installed on the host. |
| `VIDEO_ASSEMBLY_SUBTITLE_FONTSDIR` | No | Optional extra directory passed to FFmpeg `subtitles=...:fontsdir=...` if fontconfig cannot find the font. |

Apply migrations **`034`** (jobs table + RLS + claim RPC) and **`035`** (Realtime broadcast for dashboard progress) to your Supabase project before relying on production assembly. The dashboard uses Realtime for job updates and falls back to slower HTTP polling if Realtime is unavailable.

### If the Fly machine shows **Stopped** / **Suspended**

Common causes:

1. **Crash loop** — e.g. the process exited on startup (older logs may show `MODULE_NOT_FOUND` or missing env). Fly stops the machine after **max restart count** (~10). Fix the image/config, then either **`fly deploy`** or **`fly machine start <id> -a elevate-video-assembly`** (see `fly machine list -a elevate-video-assembly`).
2. **Health check warning** while `STATE=started` — can appear until the first successful `GET /health`; wait ~30s or check `fly logs -a elevate-video-assembly`.

After a clean deploy, confirm: `fly logs -a elevate-video-assembly` should show `[assembly-worker] poll loop started`.

## Storage

Uploaded paths: `studio-assembled/{organization_id}/{episode_id}/{job_id}.mp4`.

The dashboard resolves **signed playback URLs** for assembled MP4s when the bucket is private.

### Subtitles (Korean / CJK)

SRT burn-in uses FFmpeg’s `subtitles` filter (libass). Without CJK fonts installed, Hangul appears as empty boxes (□). The worker **Dockerfile** installs **`fonts-noto-cjk`**; redeploy Fly after changing fonts. For local **`STUDIO_VIDEO_ASSEMBLY_MODE=sync`**, install a CJK font (e.g. Noto) or set `VIDEO_ASSEMBLY_SUBTITLE_FONT` to a family your OS provides (see `.env.local.example`).

## Run locally (same machine as `pnpm dev`)

**Dashboard (`pnpm dev`):** default assembly mode is **`async`** — it only inserts into `studio_video_assembly_jobs`. Use the **same Supabase project** in `.env.local` as your Fly worker so a deployed worker can complete jobs **without** running a worker on your laptop and **without** installing local ffmpeg.

**Optional local worker:** use the same values as `.env.local` (Supabase URL, service role, bucket). FFmpeg must be on `PATH` (e.g. `brew install ffmpeg`) for the worker process.

The worker entrypoint loads `.env.local` and `.env` from the repo root when **not** running on Fly (`FLY_APP_NAME` is unset), so `pnpm run worker:assembly` picks up the same variables as Next.js without extra flags.

```bash
pnpm run worker:assembly
```

- **`STUDIO_VIDEO_ASSEMBLY_MODE=sync`** — runs ffmpeg inside the Next.js dev server (needs local ffmpeg); use when you are not using a remote worker.

## Fly.io (recommended deployment)

Repo root [`fly.toml`](../fly.toml) builds [`workers/video-assembly/Dockerfile`](../workers/video-assembly/Dockerfile) and runs one machine in **`nrt`** (Tokyo / Narita) with **2GB RAM**, health check on **`/health`**, and **`auto_stop_machines = "off"`** so jobs are not delayed by cold starts. (`icn` was unreliable for this VM profile; change `primary_region` in `fly.toml` if Fly adds capacity later.)

1. Install CLI: [Install flyctl](https://fly.io/docs/hands-on/install-flyctl/)
2. Log in: `fly auth login`
3. Create the app once (name must match `app` in `fly.toml`, or edit `fly.toml`):

   ```bash
   fly apps create elevate-video-assembly
   ```

   If the name is taken, pick another name and set `app = "..."` in `fly.toml`.

4. Set secrets (same Supabase project as Vercel):

   ```bash
   fly secrets set \
     NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
     SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
     CONTENT_STORAGE_BUCKET="elevate-content"
   ```

   Optional: `WORKER_POLL_IDLE_MS=2500`

5. Deploy from repository root:

   ```bash
   ./scripts/deploy-fly-video-worker.sh
   ```

   or: `fly deploy`

### GitHub Actions (`main`)

[`/.github/workflows/fly-video-assembly.yml`](../.github/workflows/fly-video-assembly.yml) runs on pushes to **`main`** when worker-related paths change. Add repository secret **`FLY_API_TOKEN`** (same token as `fly tokens create deploy -a elevate-video-assembly`). Runtime secrets (Supabase, bucket) stay on Fly via `fly secrets set`, not in GitHub.

**Scaling:** One process runs one FFmpeg job at a time. To increase throughput, run more machines: `fly scale count 2` (Postgres `SKIP_LOCKED` allows multiple workers).

**Performance note:** Throughput is dominated by **FFmpeg encoding**, not the Node event loop. Rewriting the poller in Rust would not materially speed up video encode; optimizing presets, resolution, or parallel machines matters more. Revisit Rust (or a native encoder pipeline) only if you move beyond “spawn ffmpeg” architecture.

## Docker (any host)

The same Dockerfile works on Railway, Cloud Run, etc. Provide the same env vars; expose **port 8080** if the platform expects HTTP health (Fly sets `PORT` automatically).

## Modes (Next.js / Vercel)

- **`STUDIO_VIDEO_ASSEMBLY_MODE`**: `sync` runs FFmpeg inside the Next.js server; `async` inserts into `studio_video_assembly_jobs`. **Default: `async`** (set `sync` only for local ffmpeg without a worker).

## Vercel (production)

- Default is already **`async`**; set **`STUDIO_VIDEO_ASSEMBLY_MODE=sync`** only if you intentionally want Vercel to run ffmpeg (unusual on serverless).
- Do **not** run this worker on Vercel Serverless; keep it on Fly (or another long-lived host).
- No worker URL is required in Vercel env — only Supabase credentials and bucket name, same as today.
