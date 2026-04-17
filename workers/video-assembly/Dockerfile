# FFmpeg video assembly worker — poll Supabase jobs, encode, upload to Storage.
FROM node:20-bookworm-slim

# fonts-noto-cjk: Korean/CJK glyphs for libass subtitle burn-in (without it, Hangul renders as □).
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg fonts-noto-cjk \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
COPY tsconfig.json ./

RUN corepack enable pnpm \
  && pnpm install --frozen-lockfile

COPY src ./src
COPY workers/video-assembly ./workers/video-assembly

# Supabase URL + service role + optional CONTENT_STORAGE_BUCKET, WORKER_POLL_IDLE_MS
CMD ["pnpm", "exec", "tsx", "workers/video-assembly/run.ts"]
