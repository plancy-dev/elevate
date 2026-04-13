# Runway로 유튜브 숏(세로) 만드는 실행 런북

> **목적:** 전문가가 아니어도 **같은 순서만 반복**하면 한 편(BYT-001 같은 에피소드)을 끝까지 만들 수 있게 한다.  
> **도구:** [Runway](https://app.runwayml.com/) 웹앱(예: Gen-4.5 비디오 생성 화면).  
> **전제:** 영상은 **컷 여러 개를 Runway에서 생성** → **편집 앱에서 이어 붙이기** → 자막·음성은 편집 단계에서 추가한다.

---

## 0. 숏 기본값 (한 번만 외우기)

| 항목 | 값 | 이유 |
|------|-----|------|
| 화면 비율 | **9:16** | 유튜브 숏·릴스·틱톡 공통 세로 |
| 컷 길이 | **4~5초** (Runway에서 선택 가능한 값) | 한 컷 = 한 번 Generate |
| 모델 | 팀에서 쓰는 것(예: **Gen-4.5**) | 화면 왼쪽 아래 드롭다운 |
| 음성 | Runway에서 안 넣어도 됨 | 나중에 편집 앱에서 TTS/녹음 |

Runway 화면에서 **Aspect Ratio가 16:9로 되어 있으면 반드시 9:16으로 바꾼다.** (숏이 아니면 위·아래가 잘리거나 레터박스가 된다.)

---

## 1. 한 편을 만드는 전체 순서 (큰 그림)

에피소드 하나(예: `BYT-003`)를 기준으로 한다.

1. **기획은 이미 있음** — 컷 목록(C1~C6)과 컷별 프롬프트 스켈레톤.
2. **Runway에서 컷마다 영상 조각 생성** — C1 한 번, C2 한 번, … 순서대로.
3. **파일 저장** — 각 컷을 다운로드해서 `BYT-003-C1.mp4`처럼 이름 붙이기.
4. **편집 앱** — 같은 순서로 타임라인에 놓고 이어 붙이기.
5. **자막·나레이션** — 훅 문장·본문을 덮어씀.
6. **내보내기** — 9:16, 1080×1920 권장.

이 문서는 **§3~4(Runway)** 를 가장 자세히 설명한다.

---

## 2. Video 도구 목록에서 무엇을 고를까?

Runway는 **먼저 “어떤 비디오 도구냐”를 고르고**, 그 안에서 프롬프트·비율·길이를 넣는 구조일 수 있다. 아래는 **BYT 런북(컷마다 다른 프롬프트 → 편집 앱에서 합침)** 기준이다.

### 2-1. 기본 추천 (대부분의 컷)

| 우선순위 | 도구 | 언제 쓰나 |
|----------|------|-----------|
| **1순위** | **Scene Builder** | 컷을 **한 편 안에서 단계적으로** 잡고, “구도 → 생성”이 보이면 좋을 때. **처음 배우기에 가장 실수가 적다**는 뜻으로 추천. |
| **2순위** | **Multi-Shot Video** | **한 번의 프롬프트로 여러 샷**이 한꺼번에 나오게 하고 싶을 때. 단, 설명이 “**single prompt**”면 **컷마다 프롬프트가 다른 우리 기획**과 맞지 않을 수 있음 → 화면 안에서 **샷별로 문장을 나눌 수 있는지**를 연다. 나눌 수 없으면 **컷마다 별도 세션**으로 쓰거나 Scene Builder로 간다. |
| **보조** | **References to Video** | **톤·색·조명**이 컷마다 흔들릴 때. 팀에서 만든 **스타일 레퍼런스 이미지 1~2장**을 올리고 같은 글로벌 스타일을 유지할 때. |

### 2-2. 이번 파이프라인에서 보통 쓰지 않는 것

| 도구 | 이유 |
|------|------|
| **Product Shot Video Builder** | 제품 사진 → 광고 영상. **BYT(추상·노이즈·UI 메타포)** 와 목적이 다름. |
| **Remove / Upscale / Edit / Backdrop / Stylize / Color / Lighting / Weather / Time of Day** | **이미 있는 클립을 고치는** 도구들. **첫 생성** 단계보다는 **나중에** “이 컷만 배경만 바꿔줘” 할 때. |
| **Performance Capture (Act-Two)** | 사람 연기로 캐릭터 구동. **얼굴·연기**가 중심일 때. BYT 기본 톤과는 보통 맞지 않음. |
| **Character Swap** | 특정 캐릭터 합성. 필요할 때만. |
| **Motion Sketch** | 그림으로 모션 지시. 고급·실험용. |
| **Image to Dialogue** | 이미지→대사 중심. 우리는 **자막은 편집 앱**에서 넣는 전제. |

### 2-3. 실무에서의 선택 한 줄

1. **처음 한 주:** **Scene Builder**로만 `BYT-001`의 C1~C3만 만들어 본다(짧게 성공 경험).  
2. **한 프롬프트로 여러 샷이 편하다**고 느껴지면 **Multi-Shot Video**를 열어, **샷 단위 제어**가 되는지 확인한 뒤 채택한다.  
3. **스타일이 제각각이면** 같은 에피소드 안에서 **References to Video**를 시험한다.

> **UI는 자주 바뀐다.** 이 문서는 **특정 날짜의 픽셀 단위 UI를 보증하지 않는다.** 메뉴 이름이 조금 달라도 위 **역할 기준**으로 같은 것을 고르면 된다.

---

## 3. Runway 웹앱 들어가기

1. 브라우저에서 [https://app.runwayml.com/](https://app.runwayml.com/) 로그인.
2. **Video** 영역으로 들어간다. **Image / Video / Audio** 또는 **Starter Kits / … / Video** 같은 상단 탭이 있으면 **Video** 선택.
3. **§2에서 고른 도구**(예: Scene Builder)를 연다.
4. 안에 **프롬프트 입력란**, **First Video Frame**(선택), **Aspect Ratio**, **Duration**, **모델(Gen-4.5 등)**, **Generate** 가 보이면 다음 절로 진행한다.

---

## 4. 컷 하나를 만드는 절차 (이걸 C1, C2, … 반복)

아래는 **한 컷을 만들 때마다** 하는 일이다. **Scene Builder**를 쓰면 **프레임 생성 + 애니메이트** 두 단계로 나뉜다(§4-0).

### 4-0. Scene Builder 화면에서 — 어디에 뭘 쓰나

왼쪽 위에 **Step 1: Frame your scene** / **Step 2: Animate your scene** 이 보일 때 기준이다.

| 화면에 보이는 곳 | 넣을 내용 |
|------------------|-----------|
| **Step 1 · “Describe what you imagine”** (큰 텍스트 상자) | 기획서의 **글로벌 스타일 문단 + 이번 컷 전용 문장**(예: C1)을 **한 덩어리로** 붙여 넣는다. (안내에 **최소 10자**가 있으면 그 이상으로.) |
| **+ Add references** | **선택.** 톤이 컷마다 달라질 때만 **참고 이미지**를 1~2장. **처음 연습할 때는 비워도 된다.** |
| **Scene suggestions** (입력 아래에 뜨는 영역) | 입력하면 **시네마틱 추천**이 나올 수 있다. **필수 아님** — 마음에 들면 고르고, 아니면 **위 프롬프트만**으로 진행해도 된다. |
| **Aspect Ratio** (보통 왼쪽 아래 근처) | **9:16**으로 바꾼다. **16:9로 두면 숏이 아니다.** |
| **Generate Frame** (또는 Step 1의 생성 버튼) | 눌러서 **이 컷의 첫 화면(정지 이미지)** 을 만든다. |
| **Step 2: Animate your scene** | Step 1 결과가 마음에 들면 전환한다. **움직임**만 정해서 **짧은 영상 클립**으로 만든다. (길이·모션 옵션은 화면에 나온 대로, 가능하면 **4~5초**에 맞춘다.) |
| **다운로드 / 내보내기** | 완성된 **동영상 파일**을 저장하고 이름을 `BYT-003-C1.mp4` 처럼 붙인다. |

**한 컷 = Step 1 한 번 + Step 2 한 번**이 일반적이다. C2를 만들 때는 **다시 Step 1부터** 새 프롬프트(글로벌 + C2)를 넣는다.

### 4-0-A. Step 1 (Frame your scene)만 — 초상세로 따라하기

아래는 **Runway를 켜기 전부터** **Generate Frame 직후 검수까지** 한 컷(C1 등) 기준 순서다. **Step 2(Animate)는 하지 않는다**고 가정하고 끝까지 읽는다.

---

#### A. Runway 켜기 전 — 5분 준비

1. **종이나 메모장에 세 줄만 적는다.**  
   - `에피소드:` 예) BYT-001  
   - `컷:` 예) C1  
   - `이 컷이 보여줄 한 가지:` 예) “확신은 조명처럼 보일 뿐” 같은 **한 문장** (나중에 자막과 맞추기 쉬움)

2. **글로벌 스타일 블록**을 메모장에 **한 번** 붙여 넣고 저장해 둔다. 매 컷마다 **이 블록 전체를 복사**해서 쓴다.

```text
Vertical 9:16, cinematic short-form, dark tech-noir, subtle film grain,
teal and amber accent lighting, abstract futuristic UI holograms,
no readable logos, no celebrity faces, no gore, no text in-image,
slow controlled camera, high clarity, 4k look.
```

3. **이번 컷 전용 문장**만 기획서에서 가져와 메모장 **아래에** 붙인다. (예: BYT-001 C1 스켈레톤이면 spotlight / statue 같은 문장.)

4. **최종 Runway 입력용**으로 **위 둘을 하나의 블록으로** 이어 붙인다. 중간에 빈 줄 한 줄 넣어도 된다.

---

#### B. (선택) 챗봇으로 프롬프트만 다듬기

Runway에 넣기 전에 **영어가 어색하거나 너무 짧을 때**만 한다.

1. **Claude, ChatGPT, Cursor** 등 아무 챗봇이나 연다.
2. 아래를 **복사해서** 넣고, **메모장에 만든 글로벌+컷 합본**을 붙인다.

```text
You are helping me write a single image-generation prompt for Runway Scene Builder Step 1 (static frame, vertical 9:16).

Rules:
- Output ONE English prompt paragraph only.
- Keep: dark tech-noir, teal/amber, abstract UI, no readable text in the image, no logos, no real celebrity faces.
- Do not add dialogue or on-screen captions.
- Merge the global style block and the cut-specific sentence into one coherent description.
```

3. 챗봇이 준 **한 덩어리**를 메모장에 **최종본**으로 저장한다.
4. **검토:** 문장에 “text says…” “subtitle…” 같은 말이 들어가 있으면 **삭제**하고, 여전히 `no text in-image` 를 마지막에 한 번 더 넣는다.

---

#### C. (선택) 참고 이미지를 다른 AI로 만든 뒤 Runway에 넣기

**Add references**를 쓸 때만. 첫 주에는 **비워도 된다.**

1. **목적:** 색·조명·질감만 맞추는 **무드보드 1장**. “이 장면 그대로”가 아니라 **톤 레퍼런스**로 쓴다.
2. **쓸 수 있는 도구 예:** Runway의 **Image** 도구, Midjourney, ChatGPT 이미지, Adobe Firefly, Leonardo 등 **본인 계정으로 쓰는 것** 아무거나.
3. **프롬프트 예시 (짧게):**

```text
Abstract dark tech noir moodboard, teal and amber light, soft film grain,
futuristic holographic UI shapes, no text, no logos, vertical composition --ar 9:16
```

4. 이미지를 **세로에 가깝게** 저장한다. (도구마다 “9:16” 또는 `--ar 9:16` 지원.)
5. Runway Step 1에서 **+ Add references**에 그 파일을 올린다. **1장이면 충분**하고, 2장까지는 스타일이 비슷한 것만.

---

#### D. Runway — Step 1 화면에서 하는 일 (순서 고정)

1. [Runway](https://app.runwayml.com/) 로그인 → **Video** → **Scene Builder** 실행.
2. **Step 1: Frame your scene** 이 선택돼 있는지 본다. (Step 2만 보이면 Step 1을 누른다.)
3. **Aspect Ratio를 먼저 9:16으로 바꾼다.**  
   - 이유: 나중에 바꾸면 구도가 어색해질 수 있어서 **프롬프트 넣기 전**이 안전하다.
4. **“Describe what you imagine”** 칸을 클릭하고, 메모장의 **최종 합본 프롬프트**를 **전부** 붙여 넣는다.
5. **+ Add references:** C에서 만든 이미지가 있으면 업로드. 없으면 **건너뛴다.**
6. **Scene suggestions**가 뜨면:  
   - **처음:** 무시하고 **Generate Frame**으로 가도 된다.  
   - **막힐 때:** 제안 중 하나를 골라 **프롬프트에 섞인 형태**로 바뀌는지 확인하고 Generate.
7. **Generate Frame** (또는 동일 의미의 버튼)을 누른다.
8. 생성이 끝날 때까지 기다린다. (실패 메시지가 나오면 §7 참고.)

---

#### E. Step 1 결과물 검수 — 체크리스트

정지 이미지가 나오면 **아직 Step 2로 가지 않고** 아래만 본다.

| 확인 | 질문 |
|------|------|
| 비율 | **세로**인가? 가로 레터박스만 있는 건 아닌가? |
| 주제 | 이 컷의 한 문장( A에서 적은 것 )과 **분위기가 맞는가?** |
| 텍스트 | 화면에 **읽히는 글자**가 생겼는가? (생겼으면 아래 F로) |
| 안전 | 과도한 폭력·노출·실존 인물 닮음은 없는가? (있으면 재생성) |

**합격**이면: 이 프레임을 **이 컷의 기준 프레임**으로 두고, 다음은 **Step 2 (Animate)** 로 넘어간다. (Step 2 런북은 별도로 정리 가능.)

---

#### F. 마음에 안 들 때 — Step 1 안에서만 할 일

1. **같은 프롬프트로 한 번 더 Generate** (시드가 바뀌며 다른 변형이 나온다).
2. **프롬프트에 카메라 한 줄 추가:** 예) `extreme close-up` 또는 `wide establishing shot, negative space at top for captions`
3. **너무 복잡하면** 컷 문장을 **짧게** 줄이고, 글로벌 블록은 유지한다.
4. **글자가 자꾸 나오면** 프롬프트 끝에 `absolutely no typography, no letters, no numbers in frame` 을 추가한다.
5. 그래도 안 되면 **Add references**에 **C절** 무드보드 1장을 넣고 다시 Generate.

---

#### G. Step 1 끝났을 때 파일 이름 (선택)

정지 프레임을 **이미지로 저장**하는 UI가 있으면: `BYT-001-C1-frame.png` 처럼 저장해 두면, 나중에 **같은 컷 재작업**할 때 찾기 쉽다. (필수는 아님.)

---

### 4-1. 설정 먼저 고정

1. **Aspect Ratio** → **9:16** (세로). **Scene Builder면 Step 1에서 미리 바꾼다.**
2. **Duration** → **5s** (또는 4s 등 팀에서 정한 값; 컷마다 동일하게 맞추면 편집이 쉽다). *(Scene Builder는 Step 2에서 선택할 수 있을 수 있다.)*
3. **모델** → 예: **Gen-4.5** (화면에 보이는 드롭다운).
4. (있으면) **Motion / Camera** — 처음에는 **기본값** 두고, 나중에 “카메라만 살짝” 필요할 때만 건드린다.

### 4-2. 프롬프트 붙여넣기

기획서에 있는 내용을 **한 덩어리**로 넣는다.

1. **글로벌 스타일** (매 컷 동일한 문단)  
2. **그 컷 전용 문장** (예: C3용 “Thin verification laser scanning…”)

형식 예시:

```text
Vertical 9:16, cinematic short-form, dark tech-noir, subtle film grain,
teal and amber accent lighting, abstract futuristic UI holograms,
no readable logos, no celebrity faces, no gore, no text in-image,
slow controlled camera, high clarity, 4k look.

[여기에 C3 스켈레톤 문장 붙이기]
```

- **Scene Builder**면 **“Describe what you imagine”** 칸이 그 역할이다. 다른 도구면 **“Describe your shot…”** 같은 큰 입력칸에 **여기에 전부** 넣는다.
- **이미지에 글자가 생기는 것**을 피하려고 `no text in-image` 를 넣어 두고, **실제 글자·제목은 편집 앱에서 자막으로** 넣는 방식이 안정적이다.

### 4-3. First Video Frame (선택)

- **비워 두면** Runway가 프롬프트만 보고 시작 프레임을 만든다. **처음엔 전부 비우고 진행**해도 된다.
- **연속성**이 필요하면: 이전 컷의 **마지막 장면을 캡처**하거나 Runway가 준 **마지막 프레임**을 이미지로 저장해 **다음 컷의 First Video Frame**에 올린다. (익숙해진 뒤에 적용해도 됨.)

### 4-4. Generate

1. **Generate** / **Generate Frame**(Scene Builder Step 1) / 이후 **Animate**(Step 2) 순으로 버튼을 누른다.
2. 생성이 끝날 때까지 기다린다.
3. 결과가 마음에 안 들면:
   - 프롬프트에서 **형용사만** 조금 바꾸거나,
   - **Seed / 재생성** 옵션이 있으면 같은 프롬프트로 한 번 더,
   - 그래도 안 되면 **Duration·Motion**을 건드리기보다 **문장을 더 구체적으로** 바꾼다.

### 4-5. 저장

1. 완성된 클립을 **다운로드**(또는 내보내기).
2. 파일 이름 규칙: **`BYT-003-C3.mp4`** 처럼 **에피소드ID + 컷번호**.

한 편에 컷이 6개면 **Generate는 6번** 하는 셈이다.

---

## 5. 한 편(BYT-XXX) 체크리스트 — 인쇄해서 쓰기용

에피소드 시작할 때마다 복사해서 쓴다.

- [ ] Runway **Video** → **§2에서 고른 도구**(예: Scene Builder)
- [ ] **9:16** / **5s**(또는 팀 고정값) / 모델 선택 완료
- [ ] C1 프롬프트(글로벌 + C1) 입력 → Generate → `BYT-XXX-C1` 저장
- [ ] C2 … 동일
- [ ] … 마지막 컷까지
- [ ] 편집 앱에서 C1→C2→… 순서 배치
- [ ] 자막·음성 추가
- [ ] 최종 내보내기 세로 확인

---

## 6. gstack 파이프라인과 1:1 대응 (무엇을 어디서 하면 되는지)

| 단계 | 당신이 하는 일 | Runway와의 관계 |
|------|----------------|-----------------|
| office-hours | 주제·톤·금지선 정리 | Runway X |
| plan-ceo | 채널 약속 한 줄 | Runway X |
| plan-eng | 컷 리스트 + 프롬프트 스켈레톤 | **여기까지가 “Runway에 넣을 글”** |
| **Runway 생성·컷** | 위 **§4 절차** 반복 | **이 문서의 핵심** |
| plan-design | 첫 1초 자막 위치·글자 크기 | 편집 앱(또는 자막 템플릿) |
| qa-only | 과장·정책 문구 점검 | 업로드 직전 |
| browse (선택) | 경쟁 숏 첫 1초 참고 | Runway X |

**정리:** Runway에서는 **“plan-eng까지 나온 프롬프트를 복사 → 9:16 설정 → Generate → 파일 저장”** 만 반복하면 된다.

---

## 7. 자주 막히는 것

### Generate가 비활성(회색)이에요

- 프롬프트 칸이 **비어 있거나**, 팀 **크레딧/플랜**이 부족한 경우가 많다. 문장을 한 줄이라도 넣고, 계정·요금제를 확인한다.

### 화면이 가로예요

- **Aspect Ratio를 9:16**으로 바꿨는지 다시 본다. (스크린샷 기준 기본이 16:9일 수 있음.)

### 컷마다 그림체가 달라요

- **글로벌 스타일 문단을 매 컷 빠짐없이** 넣는다.
- 그래도 들쭉날쭉하면 **첫 컷을 First Video Frame으로** 다음 컷에 넘기는 방식을 시도한다.

### 한 번에 긴 숏을 Runway에 맡기고 싶어요

- 이 런북은 **짧은 조각 여러 개를 이어 붙이는 방식**을 전제로 한다. 한 번에 30초를 통째로 맡기면 **편집·재시도**가 더 어려워지는 경우가 많다.

---

## 8. 다음에 문서를 고칠 때(선택)

- 팀에서 **고정 Duration**(예: 항상 4s)이나 **모델명**이 정해지면 이 파일의 표만 수정하면 된다.
- 실제 사용하는 **편집 앱 이름**(CapCut, DaVinci 등)을 §5 체크리스트 근처에 한 줄 추가해도 좋다.

---

## 참고 링크

- Runway 웹앱: [https://app.runwayml.com/](https://app.runwayml.com/)
- **Step 2 (Animate)** 선택지·Optional 모션 문구·Elevate 아티팩트 JSON: [RUNWAY_SCENE_BUILDER_STEP2.md](./RUNWAY_SCENE_BUILDER_STEP2.md)
