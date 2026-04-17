import type { Json } from "@/types/database.types";

/**
 * Sample “AI 숏폼 + 수익화” org workflow for demos.
 * Titles are prefixed with `[데모]` so they are easy to spot and delete.
 *
 * Scenario: 소규모 팀이 ChatGPT/제미나이로 훅·대본을 잡고, Runway·클링으로 영상을 뽑아
 * YouTube Shorts / 릴스에 올리고, 설명란·고정 댓으로 수익 링크를 운영하는 흐름.
 */
export const DEMO_SCENARIO_SUMMARY_KO =
  "1인·소규모 크리에이터 팀이 AI로 숏폼을 만들고 쇼츠·릴스로 노출한 뒤, " +
  "광고·스폰·애필리에이트로 수익화하는 과정을 에피소드(한 편)와 아티팩트(프롬프트·링크·설정)로 나눠 기록합니다.";

export type DemoArtifactSeed = {
  artifact_role: string;
  tool_platform: string;
  content_text: string;
  external_url: string | null;
  metadata: Json;
  sort_order: number;
};

export type DemoEpisodeSeed = {
  title: string;
  status: "draft" | "ready" | "published" | "archived";
  distribution_label: string;
  publish_url: string | null;
  notes: string;
  artifacts: DemoArtifactSeed[];
};

export function getDemoEpisodesForOrgSeed(): DemoEpisodeSeed[] {
  return [
    {
      title: "[데모] 쇼츠 — 제품 데모 15초 (훅 A, 초안)",
      status: "draft",
      distribution_label: "youtube_shorts",
      publish_url: null,
      notes:
        "시나리오: 신규 유입용 짧은 제품 데모. ChatGPT로 훅 3안 → Runway에서 9:16 클립만 먼저 생성해 비용 통제. " +
        "수익: YouTube 광고 + 설명란 애필리에이트 링크(고정 댓). 다음 스텝: 썸네일 문구 확정 후 상태를 Ready로.",
      artifacts: [
        {
          artifact_role: "script",
          tool_platform: "chatgpt",
          content_text: [
            "【훅 옵션 3안 — 15초 내 읽기】",
            "① 문제 제기: “OO 할 때마다 시간 낭비하지 않으려면…”",
            "② 결과 먼저: “3분 만에 이게 정리됩니다.”",
            "③ 질문: “아직 엑셀로 버티고 계신가요?”",
            "",
            "【본문 초안 — 15초용】",
            "(0–3초) 훅",
            "(3–10초) 제품 화면 2컷 + 한 줄 가치",
            "(10–15초) CTA: 프로필 링크 / 무료 체험",
            "",
            "※ 실제 촬영 없이 AI 영상만 쓸 때는 화면 녹화·제품 UI 캡처 권리 확인.",
          ].join("\n"),
          external_url: null,
          metadata: {
            model: "gpt-4.x",
            purpose: "hook_and_voiceover_draft",
          },
          sort_order: 0,
        },
        {
          artifact_role: "prompt",
          tool_platform: "runway",
          content_text: [
            "Vertical 9:16. Photoreal product demo, clean desk, soft daylight.",
            "Smartphone screen shows app UI (blur logos). Smooth pan, shallow depth of field.",
            "No text overlay. Neutral upbeat mood. 15 seconds max.",
            "Avoid: distorted hands, unreadable UI, watermark.",
          ].join("\n"),
          external_url: null,
          metadata: {
            aspect_ratio: "9:16",
            duration_sec: 15,
            gen_attempt: 1,
          },
          sort_order: 1,
        },
        {
          artifact_role: "settings",
          tool_platform: "runway",
          content_text:
            "Gen-3 Alpha Turbo 유사 설정 가정. 실제 생성 시 대시보드에 찍힌 시드·모델명을 metadata에 복사해 재현성 확보.",
          external_url: null,
          metadata: {
            note: "Replace with real seed/model from tool after render",
            resolution: "1080x1920",
          },
          sort_order: 2,
        },
        {
          artifact_role: "other",
          tool_platform: "other",
          content_text: [
            "【수익화 체크리스트 — 초안】",
            "- 설명 상단: 한 줄 가치 제안 + 링크",
            "- 고정 댓: 애필리에이트 또는 리드 마그넛",
            "- 쇼츠 피드와 롱폼에 동일 메시지 정렬(선택)",
          ].join("\n"),
          external_url: null,
          metadata: { lane: "monetization_notes" },
          sort_order: 3,
        },
      ],
    },
    {
      title: "[데모] 릴스 — 고객 후기 UGC 톤 (편집 대기)",
      status: "ready",
      distribution_label: "instagram_reels",
      publish_url: null,
      notes:
        "시나리오: 실제 고객 인터뷰 대신 AI 생성 UGC 스타일 B-roll + 자막. " +
        "클링으로 보조 클립 생성, 캡컷에서 자막·BGM만 넣으면 업로드 가능한 상태(Ready).",
      artifacts: [
        {
          artifact_role: "script",
          tool_platform: "chatgpt",
          content_text: [
            "【릴스 대본 — 20초】",
            "톤: 밝고 신뢰, 1인 카메라",
            "",
            "0–4초: “우리 팀도 예전엔 수작업이었어요.”",
            "4–12초: “지금은 OO 한 번이면 끝.”",
            "12–18초: “데이터만 넣으면 돼요.”",
            "18–20초: “링크는 프로필.”",
            "",
            "자막: 짧은 문장, 2줄 이내.",
          ].join("\n"),
          external_url: null,
          metadata: { tone: "ugc_testimonial" },
          sort_order: 0,
        },
        {
          artifact_role: "prompt",
          tool_platform: "kling",
          content_text: [
            "Subject: founder-style person at laptop, modern office, natural smile.",
            "Camera: handheld subtle movement, vertical 9:16.",
            "Lighting: soft, realistic skin tones.",
            "No subtitles burned in. No brand logos.",
          ].join("\n"),
          external_url: null,
          metadata: { clip_role: "b_roll" },
          sort_order: 1,
        },
        {
          artifact_role: "render_output",
          tool_platform: "other",
          content_text:
            "캡컷 프로젝트 파일은 로컬-only. 여기에는 ‘최종 내보내기 전’ 검수 메모만 둡니다.",
          external_url: "https://www.capcut.com/",
          metadata: { editor: "capcut", status: "pending_final_export" },
          sort_order: 2,
        },
      ],
    },
    {
      title: "[데모] 유튜브 쇼츠 #12 — 튜토리얼 클립 (게시됨)",
      status: "published",
      distribution_label: "youtube_shorts",
      publish_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
      notes:
        "시나리오: ‘Me at the zoo’ 스타일이 아니라 **데모용 placeholder URL**입니다. 실제 운영 시 본인 쇼츠 URL로 교체하세요. " +
        "이 에피소드는 Published로 두어 목록·한눈에에서 ‘완료된 한 편’ 예시로 씁니다.",
      artifacts: [
        {
          artifact_role: "prompt",
          tool_platform: "gemini",
          content_text: [
            "【Shorts 제목·설명 초안】",
            "제목: 30초만에 OO 정리하는 법",
            "설명 첫 줄: 무료 체험 링크 + 문제 정의",
            "해시태그: #shorts #saas #생산성",
            "",
            "※ 실제 게시 시 SEO/정책에 맞게 수정.",
          ].join("\n"),
          external_url: null,
          metadata: { purpose: "youtube_metadata" },
          sort_order: 0,
        },
        {
          artifact_role: "render_output",
          tool_platform: "runway",
          content_text:
            "최종 렌더 mp4는 클라우드 드라이브에 두고, 여기에는 공유 링크만 남깁니다(팀 재사용).",
          external_url: "https://example.com/files/demo-short-final.mp4",
          metadata: { asset_type: "final_mp4_placeholder" },
          sort_order: 1,
        },
        {
          artifact_role: "thumbnail",
          tool_platform: "other",
          content_text:
            "썸네일 카피: 큰 숫자 ‘30초’ + 제품 스크린 작게. Canva 등 템플릿 링크는 팀 내부 규칙에 따라 별도.",
          external_url: null,
          metadata: { note: "replace example.com link with real asset host" },
          sort_order: 2,
        },
      ],
    },
  ];
}
