# Runway Scene Builder — Step 2 (Animate your scene) 가이드

> Step 1에서 만든 **정지 프레임**을 **짧은 영상 클립**으로 만드는 단계.  
> 아래 **BYT-001 · C1** 기준으로 선택지와 Optional 칸 예시를 고정해 두었다. 다른 컷은 같은 **역할 매핑**으로 골라 바꾼다.

---

## 1. 공통 순서 (매 컷)

1. Step 2 화면에서 **프레임 썸네일**이 보이는지 확인한다.
2. **Camera** (또는 Camera & motion suggestions) → 아래 표처럼 고른다.
3. **Character** (있으면) → 고른다.
4. **Environment** (있으면) → 고른다.
5. **`[Optional]` 모션 프롬프트** → 복붙하거나 한 줄만 수정한다.
6. **해상도:** 반복·시험은 **720p**, 최종 내보내기만 **4K**를 쓰는 식으로 비용·시간을 나눈다. (플랜이 Unlimited여도 생성 시간은 든다.)
7. **Generate Video** → 완료 후 다운로드 → 파일명 `BYT-001-C1.mp4` 등.

---

## 2. BYT-001 · C1 — 스크린에 나온 선택지 그대로 매핑

프레임이 **어두운 조각상형 피겨 + 틸/앰버 + 홀로그램 UI void** 인 경우(현재 세션) 아래를 권장한다.

### Camera — *How should the camera reveal the … sculptural form within the void?*

| 선택지 | C1 추천 |
|--------|---------|
| Slow Lateral Pan Across Surface | **선택** — 기획의 `slow pan`과 직접 대응. |
| Focus Rack Breathing Between Contours | 초점이 숨 쉬듯 바뀌는 느낌. C1 훅보다는 **감성 클로즈업**에 적합. |
| Imperceptible Creep Forward Into Macro Detail | 서서히 전진·매크로. **대안**으로 좋음. |

**결정:** **Slow Lateral Pan Across Surface**

### Character — *How does the monolithic figure respond to or interact with the light?*

| 선택지 | C1 추천 |
|--------|---------|
| Surface Glimmers Subtly as Light Traces Geometry | **선택** — 빛이 지나가며 표면이 미세하게 반응; “확신=조명” 비유와 맞음. |
| Polished Edges Catch and Hold Teal-Amber Refraction | 틸·앰버 강조. 색을 더 팔고 싶을 때 **대안**. |
| Shadow Planes Deepen Where Light Withdraws | 빛이 빠질 때 그림자 강화. **비관·의심** 톤을 줄 때 유리. |

**결정:** **Surface Glimmers Subtly as Light Traces Geometry**

### Environment — *What ephemeral elements populate the void around the figure?*

| 선택지 | C1 추천 |
|--------|---------|
| Holographic UI Fragments Drift Laterally Through Darkness | 배경에 이미 UI 조각이 있을 때 **연속성** 좋음. **대안 1** |
| Film Grain Shifts Organically Like Suspended Particulate | 글로벌 바이블의 **필름 그레인** 강조. **대안 2** |
| Spotlight Rays Cut Through Void in Volumetric Sweeps | **스포트라이트가 공간을 가른다**는 비유에 가장 직설적. **선택(권장)** |

**결정:** **Spotlight Rays Cut Through Void in Volumetric Sweeps**  
(배경 UI 움직임을 더 살리고 싶으면 **Holographic UI Fragments…** 로 바꿔 한 번 더 생성해 본다.)

---

## 3. `[Optional]` 모션 프롬프트 — C1용 복붙 블록

아래를 통째로 Optional 칸에 넣어도 되고, 한 줄만 줄여도 된다.

```text
Slow lateral pan across the sculptural form. Light sweeps horizontally; subtle glints follow the moving highlight on the surface. Volumetric spotlight rays in a deep void; teal and amber accents; abstract holographic UI bokeh in background. Cinematic, smooth motion. No readable text, no logos, no subtitles in frame.
```

한 줄 버전:

```text
Slow lateral pan; light sweeps across surface; volumetric beams; teal-amber; no text in frame.
```

---

## 4. 다른 컷(BYT-001 C2~C6)에서의 선택 규칙 (요약)

| 컷 역할 | Camera 쪽 경향 | Character | Environment |
|---------|----------------|-----------|---------------|
| 훅·조명 비유 | Lateral pan / macro creep | Glimmer / shadow withdraw | Spotlight rays or film grain |
| 홀로그램·UI | Slight push-in or static | (약하게) | Hologram fragments |
| 다이얼·전환 | Creep or rack focus | Edges refraction | Grid or haze |

UI에 나온 문구는 시즌마다 바뀔 수 있으므로, **위 표의 “역할”**에 가장 가까운 옵션을 고른다.

---

## 5. Elevate(제작)과 연결하는 방법 (v1 — API 없음)

[ADR-003](../adr/ADR-003-studio-productions-mvp.md) 기준 **v1은 Runway API를 호출하지 않는다.** 대신 **같은 정보를 에피소드 아티팩트로 저장**해 “나중에 자동화·팀 공유·감사”에 쓴다.

### 5-1. 추천 아티팩트 구성

| `artifact_role` | `tool_platform` | `content_text` / `metadata` |
|-----------------|-------------------|------------------------------|
| `prompt` | `runway` | Step 1 전체 프롬프트(글로벌 + 컷) |
| `settings` | `runway` | 아래 JSON을 `content_text`에 그대로, 또는 `metadata`에 넣기 |
| `script` | `chatgpt` 등 | VO·자막용 영어 스크립트(선택) |
| `render_output` | `runway` | 생성 후 Runway 자산 URL 또는 로컬 업로드 링크 |

### 5-2. Step 2 설정 JSON 예시 (BYT-001-C1)

`metadata` 또는 `content_text`에 저장할 수 있는 형태:

```json
{
  "runbook": "RUNWAY_SCENE_BUILDER_STEP2",
  "version": 1,
  "episode_code": "BYT-001",
  "cut": "C1",
  "step2": {
    "optional_motion_prompt": "Slow lateral pan across the sculptural form. Light sweeps horizontally; subtle glints follow the moving highlight on the surface. Volumetric spotlight rays in a deep void; teal and amber accents; abstract holographic UI bokeh in background. Cinematic, smooth motion. No readable text, no logos, no subtitles in frame.",
    "selections": {
      "camera": "Slow Lateral Pan Across Surface",
      "character": "Surface Glimmers Subtly as Light Traces Geometry",
      "environment": "Spotlight Rays Cut Through Void in Volumetric Sweeps"
    },
    "resolution": "720p"
  }
}
```

이렇게 저장해 두면:

- **지금:** 수동으로 Runway에 다시 넣을 때 그대로 복구 가능.
- **나중:** 서버가 Runway API(또는 브라우저 자동화)를 쓸 수 있게 되면 **같은 스키마**를 입력으로 삼기 쉽다.

---

## 6. 향후 자동화(제품 방향 메모)

- **스크립트 생성:** 유튜브·노션·텍스트를 붙여 넣어 LLM이 **컷 리스트 + Step1/Step2 텍스트**를 채우는 것은 **Elevate 서버 + 허용된 LLM**으로 가능(별도 ADR·요금·할당량).
- **Runway 쪽:** 공식 API·배치가 팀 정책과 맞는지, **ToS·플랜(Unlimited 포함)** 에서 자동 생성이 허용되는지 법무·제품에서 확인 후 연동.
- **품질:** “낮은 품질이라도”는 **720p·짧은 duration·컷 수 제한**으로 맞추는 것이 안전하다.

---

## 참고

- 전체 실행 흐름: [RUNWAY_SHORTS_RUNBOOK.md](./RUNWAY_SHORTS_RUNBOOK.md)
- 제작 레저: [ADR-003](../adr/ADR-003-studio-productions-mvp.md)
