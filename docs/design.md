# MINIU Design System — Design Constitution / Design DNA

> **읽는 방법**: 이 문서는 스타일 가이드가 아니라 판단 기준서다. Claude Code가 디자인 시안 없이 새 화면을 설계·구현해야 할 때, "이 서비스라면 이 화면을 어떻게 만들 것인가"에 스스로 답하기 위해 존재한다.
>
> **`Existing` vs `Recommended` 표기 규칙**: 모든 항목에 둘 중 하나를 표시한다.
> - **`[Existing]`** — 현재 코드([app/globals.css](../app/globals.css), [shared/config/design-system.ts](../shared/config/design-system.ts), `shared/ui/**`, `entities/**`, `widgets/**`, [app/page.tsx](../app/page.tsx))에서 실제로 확인한 사실. 파일:라인을 인용한다.
> - **`[Recommended]`** — 현재 코드와 서비스 컨셉을 근거로, 앞으로 유지·확장하는 것이 바람직하다고 판단한 방향. 아직 코드로 확정되지 않았으므로 추측을 사실처럼 서술하지 않는다.
>
> **Figma 색상 검증 관련 고지**: 사용자가 제공한 Figma 파일(`RhIyoDp7y82I02pPnX5N5S`, node 97:11467)에 대해 이 세션에서 `get_variable_defs`로 변수 값을 직접 조회했으나, 로컬 Figma 앱에 해당 파일이 열려 있지 않아 실제 값을 가져오지 못했다(빈 결과/선택 요구 오류). 따라서 이 문서의 색상 값은 **`app/globals.css`에 실제 반영된 값을 최종 근거**로 삼았다. 사용자가 알려준 Background/Gray `#DBDEE9`와 코드의 `#d8dee9`(`--color-gray-quaternary`, globals.css:92)는 마지막 한 자리가 다르다 — Figma 쪽이 이후 갱신됐을 가능성이 있으니 §19 Design Debt에 검증 필요 항목으로 남긴다.
>
> **작업 범위 고지**: 이 저장소는 프론트엔드 전용 작업 대상이다. 백엔드(`app/api/**`, `app/lib/miniu/**`, DB, 인증)는 이 문서의 대상이 아니며 수정하지 않는다.

---

## 01. Product & Design Philosophy

### 서비스가 하는 일 `[Existing]`
[app/layout.tsx:6](../app/layout.tsx)의 메타 설명이 정체성을 정확히 요약한다:

> "연인의 취향과 일상을 기억하고, 둘만의 미니유를 함께 키워가는 관계 기록 앱"

핵심 루프 4가지 (탭 구성, [shared/config/design-system.ts:30-35](../shared/config/design-system.ts)):
1. **홈(home)** — 내 미니유·연인 미니유가 사는 "집"에서 채팅하고, 쓰다듬기/안아주기/뽀뽀하기로 애정을 표현.
2. **기록(record)** — 연인에 대해 알게 된 것을 짧은 메모로 남긴다.
3. **문자(letter)** — 서로에게 편지를 보낸다.
4. **프로필(profile)** — 기록에서 추출된 취향·습관·가치관이 카드로 쌓인다.

온보딩은 회원가입 → 이메일 인증 → 커플 연결(초대 코드) → 연인 정보 입력 → 연인 아바타 커스터마이징 → 연인 말투 학습(대화 캡처) → 사전 질문(관계 시작일 등) → 홈, 순서로 길고 서사적으로 구성돼 있다([app/page.tsx](../app/page.tsx)의 `AuthMode` 상태 전이 참고).

### 핵심 사용자 경험 `[Existing]` + `[Recommended]`
- `[Existing]` 온보딩의 각 단계가 짧은 폼이 아니라 배경 그라디언트+캐릭터+카피가 함께 붙는 "완결된 씬"으로 구현돼 있다(`login-screen`, `step-heading`, `avatar-style-stage` 등).
- `[Recommended]` 이 서비스는 "정보를 입력하는 앱"이 아니라 "연인을 알아가는 의식을 수행하는 공간"으로 취급해야 한다. 새 기능이 아무리 사소해도 순수 CRUD 화면(표, 필터, 설정 나열)처럼 보이면 이 철학에서 벗어난 것이다.

### 서비스가 전달하려는 감정 `[Recommended]` (근거: §10 캐릭터 상호작용, §12 카피 톤)
- **친밀함(intimacy)** — 캐릭터에게 말 걸듯 채팅하는 인터페이스(`${partnerName}에게 한마디...`, home-preview.tsx:372), 반말 대사.
- **애착(attachment)** — 쓰다듬기/안아주기/뽀뽀하기 인터랙션과 하트 파티클(`affectionHeartFloat`, globals.css:59-72)로 "돌봄"을 시각화.
- **향수(nostalgia)** — Windows 98/도스 시절 UI 크롬(창 타이틀바, 메뉴 스트립)을 재현.
- **기대감(anticipation)** — D-Day 카운트(`D+324일째 사랑 중`), 대화 잔여 횟수 표시처럼 "오늘 무엇을 할 수 있는가"를 상단에 계속 보여준다.
- 이 네 감정은 §11(모션), §12(카피)에서 구체적 구현 규칙으로 다시 연결한다.

### 가장 중요한 Visual Identity 한 줄 요약 `[Existing]`
`shared/config/design-system.ts:28`의 `rules: { data: "api-connected", radius: "sharp", pixelScale: 2 }`와 globals.css:111 주석("두꺼운 2px 잉크 테두리 + 각진 모서리")이 이미 이 서비스의 정체성을 코드 차원에서 선언하고 있다: **레트로 픽셀/Y2K 데스크톱 UI를 모바일 화면 안에 재현한 다마고치형 관계 기록 앱.** "귀엽게 둥근 모바일 SaaS 앱"이 아니다.

---

## 02. Design Principles

Claude Code가 실제 구현 중 판단 기준으로 쓸 수 있는 원칙만 담는다. ("예쁘게/귀엽게 만든다" 같은 문장은 배제.)

1. **각진 것이 기본값이다, 둥근 것은 예외다.** `[Existing→Recommended]` radius 0이 원칙(globals.css:106)이고, 둥근 모서리는 §08에서 정의한 4가지 예외 상황(바텀시트 상단 4px, 커스터마이징 갤러리 카드 16px, 알약형 탭/칩, 원형 스와치)에서만 허용한다. 새 컴포넌트를 만들 때 "이게 그 4가지 예외 중 하나인가?"를 먼저 확인한다.
2. **그림자는 입체감이 아니라 잉크 라인의 연장이다.** `[Existing]` blur 없는 오프셋 하드섀도만 쓴다(`2px 2px 0px rgba(17,17,17,0.2)` 등). 흐린 그림자로 "떠 있는 카드"를 만들지 않는다.
3. **귀여움은 장식이 아니라 인터랙션의 결과여야 한다.** `[Existing→Recommended]` 하트 파티클은 애정 버튼을 눌러야 나타나고(home-preview.tsx:501-507), 캐릭터 대사는 랜덤 로테이션으로 반응한다(`pickAffectionPhrase`). 정적으로 배치된 장식 스티커를 화면에 깔아 귀여움을 표현하지 않는다.
4. **새 화면은 기존 패턴을 먼저 확장하고, 새 시각 언어는 최후 수단이다.** `[Recommended]` §16 Canonical Patterns에 없는 조합이 필요할 때만 새 스타일을 제안하되, §06 Shape & Surface의 제약(각짐/2px 테두리/하드섀도/픽셀폰트)은 유지한다.
5. **UI 크롬과 캐릭터 표현의 모션 언어는 다르다.** `[Existing]` 토글·로더·커서 같은 UI 상태 전환은 `steps()` 이징(픽셀스러운 끊김), 캐릭터 감정 표현(하트 이펙트)은 `ease-out`(생동감). 새 애니메이션을 추가하기 전 "이게 크롬인가 감정 표현인가"를 구분한다.
6. **핑크는 애정 전용 색이다, 범용 강조색이 아니다.** `[Existing→Recommended]` `--heart` 토큰이 별도로 존재한다는 것 자체가 신호(globals.css:100). 좋아요/하트/에러 표시가 아닌 곳에 강조색이 필요하면 파랑(`primary-blue`) 계열을 먼저 검토한다.
7. **텍스트는 항상 픽셀 폰트, 톤은 해요체(시스템)/반말(캐릭터)로 분리한다.** `[Existing]` §05, §12 참고.
8. **같은 정보 밀도의 화면은 같은 크롬을 공유한다.** `[Existing→Recommended]` 홈/기록/프로필의 팝업이 전부 "창(window)" 크롬(타이틀바+메뉴스트립+winbtn 3개)을 공유한다(home-preview.tsx, record-preview.tsx, profile-preview.tsx가 동일한 `TITLE_BAR`/`WINDOW_BTN` 상수 패턴을 각자 재정의하고 있음 — 새 화면도 이 크롬을 재사용해야 하며, 필요하면 공통 컴포넌트로 뽑아 올리는 것을 고려한다).
9. **접근성은 픽셀 미학을 이유로 생략하지 않는다.** `[Existing→Recommended]` `:focus-visible`, `aria-live`, `role="dialog"`, `prefers-reduced-motion` 대응이 이미 있다(§14) — 새 컴포넌트도 이 최소선을 유지한다.
10. **디자인 시안이 없다는 것이 "기본 HTML처럼 만들어도 된다"는 뜻이 아니다.** `[Recommended]` 시안이 없을수록 이 문서의 토큰·컴포넌트·캐노니컬 패턴을 더 엄격히 따른다.

---

## 03. Visual Identity

### 세 개의 UI 세대 (가장 먼저 판별할 것) `[Existing]`
코드베이스를 전수 조사한 결과, 시기가 다른 **세 개의 디자인 언어**가 공존한다. 이전 분석에서는 두 세대만 파악됐으나, [widgets/setup-preview](../widgets/setup-preview/ui/setup-preview.tsx)를 확인한 결과 완전히 별개인 세 번째 세대가 존재함을 확인했다.

| 세대 | 대표 화면/파일 | 시각 언어 | 새 작업 시 |
|---|---|---|---|
| **① 최초 프로토타입 (모바일 목업)** | [widgets/setup-preview](../widgets/setup-preview/ui/setup-preview.tsx) — `.mock-phone`, `.phone-status`, `.app-header`, `.choice-list`, `.code-card` 등(globals.css:491-560) | 상태바를 흉내낸 순수 흰 배경 모바일 목업, `border-radius: 5~999px`, 은은한 blur 그림자(`0 6px 18px #0000000a`), Arial/시스템 폰트, 카카오톡풍 파스텔(`#ff6799`, `#f8edf1`) | **절대 참고하지 않는다.** 가장 오래된 잔재이며 픽셀/Y2K 정체성과 무관. |
| **② 중간 프리뷰 (레거시)** | 홈/기록/문자/프로필 탭 프리뷰 상당수, `.room`, `.mail-*`, `.profile-summary`, `.letter-*` 등(globals.css 전역) | 커스텀 CSS 클래스, 시스템 폰트(`--font-ui`), 파스텔 일러스트, `border-radius` 부분 사용 | **건드리지 않는다.** 유지보수 대상이 아닌 잔재. |
| **③ 확정 디자인 (Figma 기반, 최신)** | 로그인/회원가입/온보딩(`login-*`, `signup-*`, `step-*`, `avatar-style-*`), 홈 케이스(`home-case-*`), [HomePreview](../widgets/home-preview/ui/home-preview.tsx)/[RecordPreview](../widgets/record-preview/ui/record-preview.tsx)/[ProfilePreview](../widgets/profile-preview/ui/profile-preview.tsx)의 실제 렌더 로직, [shared/ui/pixel-button](../shared/ui/pixel-button/index.tsx), [shared/ui/dialog-window](../shared/ui/dialog-window/index.tsx) | Tailwind 유틸리티 + `globals.css`의 Figma 토큰(`--text-*`, `--color-*`) 직접 참조, 각짐+2px 테두리+하드섀도+픽셀폰트 | **이 스타일만 따른다.** 새 화면/컴포넌트는 전부 이 레이어로 만든다. |

`shared/config/design-system.ts:3`의 `status: "confirmed"`가 ③을 가리키며, `"CSS is the source of truth for visual tokens"`(design-system.ts:1) 주석대로 `globals.css`의 `:root` 변수가 값의 최종 근거다.

**판별 방법**: `globals.css`에서 `login-*`, `step-*`, `signup-*`, `avatar-style-*`, `home-case-*`, `field-box*`, `popup-*`, `signup-consent-*` 접두어, 그리고 `widgets/home-preview`·`widgets/record-preview`·`widgets/profile-preview`의 JSX 내부 Tailwind 클래스 = ③. `.mock-phone*`, `.phone-*`, `.choice-list`, `.code-card`, `.connect-card` = ①. 그 외 대부분(`.room`, `.mail-*`, `.profile-summary`, `.speech-bubble`, `.foundation-link` 등) = ②.

### 이 서비스가 흉내 내는 것 `[Existing]`
"귀여운 모바일 SaaS"가 아니라 **90년대 데스크톱 프로그램 창 + 게임보이 대화상자**다. 근거:
- `home-case-*`, 그리고 HomePreview/RecordPreview/ProfilePreview의 팝업이 만드는 건 진짜 Windows 98 창: 타이틀바(그라디언트 파란 바 + `jisoo_cam.exe - [Live Garden Stage]` 같은 실행파일명), 최소화/최대화/닫기 버튼 3개, 메뉴 스트립("파일(F) 동작(A) 보기(V) 도움말(H)").
- 버튼의 `▼` 화살표, 말풍선 꼬리도 `▼` 문자 — 도스/터미널 메뉴 선택 표시의 재현.
- 인풋 placeholder의 깜빡이는 커서(`miniuBlink`, globals.css:47-56) — 터미널 프롬프트 재현.

### 감정 → 시각 요소 매핑 `[Existing]` + `[Recommended]`

| 감정 | 구현 방식 | 근거 |
|---|---|---|
| 친밀함 | 캐릭터에게 직접 말 거는 채팅 UI, 반말 placeholder | `[Existing]` home-preview.tsx:372 |
| 애착 | 쓰다듬기/안아주기/뽀뽀하기 + 하트 파티클 + 랜덤 반응 대사 | `[Existing]` home-preview.tsx:215-230, :501-507 |
| 향수 | 창 크롬, 도스풍 메뉴, 픽셀 폰트 | `[Existing]` §03 위 표 |
| 설렘/기대 | D-Day, 대화 잔여 횟수, 진행 중 배지("file 01") | `[Existing]` home-preview.tsx:351-352; record-preview.tsx:326-327 |
| 다정함 | 시스템 메시지는 해요체, "~해주세요"류 부드러운 요청형 | `[Existing]` §12 |
| 개인적 공간감 | 캐릭터가 사는 "집"이라는 은유, 방문할 때 팝업으로 진입 | `[Existing]` `showHousePopup` 흐름 |
| 은은한 소유욕/설렘 | `[Recommended]` 새 기능에서 "우리만의 것"을 강조하는 문구(예: "우리 집", "우리의 문자")를 계속 쓴다 | letter-preview.tsx:91 `우리의 문자` |

---

## 04. Color

### 4.1 원자 토큰 `[Existing]` (`app/globals.css:82-124`, Figma "Color" variable collection 135:16092 주석 기준)

```css
/* Common */
--color-common-0:        #111111;
--color-common-100:      #ffffff;

/* Primary / Secondary */
--color-primary-blue:    #7cb6f6;
--color-secondary-blue:  #e9f9ff;

/* Accent */
--color-accent-pink:     #db2777;
--color-accent-pink-mid: #f296c1;

/* Text */
--color-text-primary:    #191f28;
--color-text-secondary:  #333d4b;
--color-text-tertiary:   #4e5968;
--color-text-quaternary: #6b7684;
--color-text-quinary:    #8b95a1;
--color-text-disabled:   #b0b8c1;

/* Border */
--color-border-primary:   #2b1f28;
--color-border-secondary: #d1d6db;
--color-border-tertiary:  #e5e8eb;
--color-border-quaternary:#f2f4f6;

/* Background */
--color-gray-quaternary:  #d8dee9;
```

**사용자가 요청서에서 언급한 색과의 대조**:
- Common/Primary/Secondary/Text/Border 계열은 코드와 100% 일치한다. `[Existing]`
- **Background/Gray**: 사용자 제공값 `#DBDEE9` vs 코드 `#d8dee9` — 마지막 자리 불일치. 이 세션에서 Figma 라이브 조회가 실패해 확정하지 못했다. **코드값을 최종 근거로 채택**하되 §19에 검증 필요 항목으로 남긴다. `[Existing, 주의 필요]`
- **Accent/Mint (#22D3EE)**, **Accent/Blue (#1D4ED8)**: Figma에 등록돼 있다는 사용자 설명대로, 코드에도 실제로 존재한다(아래 4.2). 다만 `globals.css`의 `:root` 변수로 등록돼 있지 않고 컴포넌트 코드에 하드코딩된 상태다. `[Existing, 토큰화 안 됨]`

### 4.2 코드에 하드코딩된 추가 액센트 (변수 미등록, 실사용 확인됨) `[Existing]`

| 색 | 값 | 실제 쓰임 | 근거 |
|---|---|---|---|
| Accent/Mint | `#22d3ee` | 아바타 커스터마이징에서 "선택됨" 표시용 링(색상 스와치·스타일 카드 테두리) | app/page.tsx:918; globals.css:368, :371 |
| Accent/Blue | `#1d4ed8` | 텍스트 링크 색(사진 추가 등 보조 액션 텍스트) | globals.css:404 (`.step-photos-add`) |
| Danger | `#a73846` | 레거시 `Button`의 `danger` variant, 유효성 에러 테두리 | shared/ui/button/index.tsx:8; globals.css(레거시 텍스트필드 error) |
| Notice/Badge pink | `bg-#fce7f3` / `border-#f9a8d4` / `text-#db2777` | "file 01" 같은 배지, 성공 토스트형 안내 배너 | record-preview.tsx:315, :326 |
| Dim overlay | `#111` @ opacity 0.8 | 팝업/다이얼로그 배경 딤 처리 | home-preview.tsx:447; record-preview.tsx:377 |

**의미**: Mint와 Blue는 "선택 상태 강조"와 "링크 텍스트"라는 뚜렷한 역할로 이미 쓰이고 있지만 `:root` 변수로 승격되지 않았다. `[Recommended]` 새 화면에서 "선택됨" 표시나 링크 텍스트가 필요하면 이 두 값을 그대로 재사용하고, 가능하면 이번 기회에 `--color-accent-mint`, `--color-accent-blue` 변수로 승격하는 것을 제안한다(§19).

### 4.3 의미 별칭(semantic alias) `[Existing]` (globals.css:97-101)
```css
--bg-base: white;  --bg-sunken: border-quaternary;  --surface: white;
--border: border-secondary;  --text: text-primary;  --text-muted: text-tertiary;
--primary: primary-blue;  --accent: secondary-blue;  --heart: accent-pink;
```
`--heart`가 독립 토큰이라는 것 자체가 "핑크 = 애정 전용" 원칙(§02-6)의 근거다.

### 4.4 색상 역할 정리

| 역할 | 토큰 | 설명 |
|---|---|---|
| 배경 그라디언트(주요 화면) | primary-blue → secondary-blue → common-100 | 로그인/온보딩/홈의 시그니처 3단 그라디언트. "이 화면이 핵심 화면"임을 알림 |
| CTA 버튼 강조 | white → pink-mid → accent-pink (세로 그라디언트) | 가장 중요한 행동 유도 |
| 보조 버튼 | gray-quaternary(#d8dee9) + 흰 테두리 | 컬러 없는 중립 액션 |
| 애정/하트 | accent-pink | §02-6 참고, 전용색 |
| 선택 상태 링 | mint(#22d3ee) | 아바타 커스터마이징 전용 액센트 |
| 링크 텍스트 | blue(#1d4ed8) | 보조 텍스트 액션 |
| 텍스트 위계 | text-primary~quinary, text-disabled | 5단 그레이스케일로 정보 위계 표현, 컬러 텍스트 남용 안 함 |
| 잉크 테두리 | border-primary(#2b1f28) | 거의 모든 컨테이너의 2px 테두리색, 순수 블랙이 아님 |

### 4.5 코드에 없는 시맨틱 컬러 `[Existing, 공백]`
globals.css:96 주석에 명시: *"hover/active/success/warning/danger 상태에 대한 Figma 변수가 없어 제거됨"*. 즉 **success(초록)/warning(노랑) 색이 디자인 시스템에 없다.** 위험 액션(회원탈퇴 등)에 쓸 수 있는 값은 레거시 `danger`(#a73846)뿐이다. `[Recommended]` 새로 success/warning이 필요하면 기존 그레이스케일+accent 팔레트와 채도가 어울리는 저채도 초록/노랑을 제안하되, 반드시 사용자 확인을 거쳐 `:root`에 정식 등록한다(추측으로 확정하지 않는다).

---

## 05. Typography

### 5.1 폰트 패밀리 & 로딩 방식 `[Existing]` (globals.css:4-27, 112-113)
- **한글 픽셀 폰트**: `DungGeunMo`(`--font-pixel-kr`), self-hosted `public/fonts/dunggeunmo/`, `font-display: swap`, weight 400만 존재.
- **영문/숫자 픽셀 폰트**: `Silkscreen`(`--font-pixel-en`), OFL 1.1, self-hosted `public/fonts/silkscreen/`, weight 400/700 둘 다 존재.
- **레거시 UI 폰트**: `--font-ui`/`--font-body` = `'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif` — 세대 ①②(§03) 전용, 신규 화면(세대 ③)에서 쓰지 않는다.
- 로딩은 `@font-face` + `woff2` 단일 포맷, Google Fonts 등 외부 CDN에 의존하지 않는다(자체 호스팅).

### 5.2 타입 스케일 `[Existing]` (globals.css:114-136, Figma node 97:11467 "🎨 Typography")

| 클래스 | size | line-height | letter-spacing | weight | 용도 |
|---|---|---|---|---|---|
| `.text-display-l` | 40px | 130% | -0.025em | 400 | 초대형 타이틀 |
| `.text-display-m` | 36px | 130% | -0.025em | 400 | 로그인/온보딩 "MINIU" 로고 |
| `.text-title-l` | 32px | 134% | -0.025em | 400 | 화면 대제목 |
| `.text-title-m` | 28px | 135% | -0.025em | 400 | 서브 대제목 |
| `.text-heading-l` | 22px | 136% | -0.025em | 400(문맥상 700도 사용, 아래 참고) | 화면/스텝 제목 |
| `.text-body-l` | 16px | 150% | 0.01em | 400 | 본문, 팝업 카피, 동의 문구 |
| `.text-body-m` | 14px | 150% | 0.014em | 400 | 보조 설명, 옵션 카드 설명 |
| `.text-label-kr` | 12px | 130% | 0.025em | 400 | 인풋 라벨, 버튼 텍스트, placeholder |
| `.text-label-en` | 12px | 130% | 0.025em | **700(고정 bold)** | 영문 라벨 |
| `.text-caption-s` | 10px | 127% | 0.03em | 400 | 캡션, 보조 힌트 |

**heading의 굵기 예외**: `.login-panel .page-heading h1`이 별도로 `font: normal 700 var(--text-heading-l-size)/...`를 지정한다(globals.css:285) — 유틸 클래스(`.text-heading-l`)의 기본 400과 다르게, 특정 컨텍스트(화면 제목)에서만 인라인으로 700을 강제한다. `[Existing]` 이는 헤딩 굵기가 상황에 따라 유동적임을 뜻하므로, 새 화면 제목도 `.text-heading-l` 그대로 쓰기보다 페이지 타이틀 위계에 맞춰 bold를 명시할지 판단한다.

**규칙**: 큰 사이즈(display/title/heading)는 letter-spacing 음수(자간 좁힘), 작은 사이즈(label/caption)는 양수(자간 넓힘) — **크면 좁게, 작으면 넓게**의 반비례 관계. `[Existing→Recommended]` 새 텍스트 스타일 추가 시 이 규칙을 따른다.

### 5.3 Placeholder, 버튼 텍스트 `[Existing]`
- placeholder 색상은 항상 `--color-text-quinary`(가장 옅은 회색), 크기는 필드 폰트와 동일(`.text-label-kr` 상당).
- 버튼 텍스트는 항상 `.text-label-kr`(12px) 크기, 화살표(`▼`)는 별도로 10px/`font-normal`로 축소.

### 5.4 CSS 우선순위 주의사항 `[Existing, 기술적 함정]`
globals.css:142-145 주석: *"`button, input { font: inherit }`가 unlayered라 Tailwind 유틸리티 레이어의 `font-pixel`보다 캐스케이드 우선순위가 높아, 버튼에 직접 준 `font-pixel`이 씹힌다."* `.miniuButton`처럼 커스텀 클래스에 `font-family`를 재명시하거나 인라인 스타일로 덮어써야 한다. 이 문제는 §15에서 다시 다룬다.

---

## 06. Layout

### 6.1 뷰포트/쉘 기준 `[Existing]`
- 기준 뷰포트: `min: 320, reference: 390, max: 460, referenceHeight: 844`([shared/config/design-system.ts:5](../shared/config/design-system.ts)) — iPhone 12/13 mini~표준 크기 기준.
- `--shell-width: 460px`(globals.css:107), `.mobile-shell { max-width: var(--shell-width); margin: auto; }` — 데스크톱에서도 모바일 폭 카드가 중앙에 뜨는 구조.
- 화면 높이는 `100dvh`/`h-dvh`를 일관되게 사용(모바일 브라우저 주소창 이슈 회피).

### 6.2 좌우 패딩 `[Existing]` + 프로젝트 규칙
- 좌우 여백은 **해상도 무관 항상 16px 고정**(기존 프로젝트 메모리 규칙과 일치). 컨텐츠 wrapper에 px 단위 `max-width`를 하드코딩하지 않는다 — 쉘 자체가 460px로 이미 제한되기 때문.
- 세대 ③ 화면들의 실제 패딩: `px-4`(16px, Tailwind) 또는 `padding: ... var(--space-16)`.

### 6.3 헤더/콘텐츠 영역/하단 네비게이션 `[Existing]`
- **헤더**: 세대 ③은 화면 상단에 고정 헤더 바 없이 로고+아이콘만 절대/relative 배치(home-preview.tsx:270-301, 높이 `h-[59px]`). 세대 ②는 별도 `.top-bar`(80px, `border-bottom`).
- **콘텐츠 영역**: `flex-1 overflow-y-auto`로 스크롤 영역 분리, 하단 고정 CTA/네비 높이만큼 `pb-[110px]`~`pb-[220px]`로 여유를 둔다(겹침 방지).
- **하단 네비게이션**: 두 가지 구현이 공존한다.
  - 레거시 `BottomTabs`([shared/ui/bottom-tabs](../shared/ui/bottom-tabs/index.tsx)): `position: sticky`, 4열 그리드, 활성 시 점(`tab-dot`) 표시.
  - 세대 ③ `NAV_ITEM`(각 프리뷰 위젯에 반복 정의, 예: home-preview.tsx:31-32): `position: fixed`, 아이콘 불투명도(0.6→1)로 활성 상태 표현, `env(safe-area-inset-bottom)` 대응.
  - `[Recommended]` 새 화면은 세대 ③의 `NAV_ITEM` 패턴을 따르되, 세 위젯에 동일 코드가 중복 정의돼 있으므로(§19) 공용 컴포넌트化를 고려한다.

### 6.4 모달/드로어 `[Existing]`
- **팝업/다이얼로그**: `position: fixed; inset: 0/auto; margin: auto` + 딤 오버레이(`bg-[#111] opacity-80`)로 중앙 배치. 네이티브 `<dialog>` 대신 순수 div+fixed 조합을 쓰는 곳(record-preview, home-preview의 확인창)과 네이티브 `<dialog showModal>`을 쓰는 곳([shared/ui/bottom-sheet](../shared/ui/bottom-sheet/index.tsx))이 공존한다.
- **바텀시트**: 네이티브 `<dialog>` + `showModal()`, 위쪽만 4px 라운드(예외적 둥굴림), 손잡이 바(`sheet-handle`) 표시. 열릴 때 `document.body.style.overflow = "hidden"`으로 배경 스크롤 잠금, 닫힐 때 이전 포커스 복원.

### 6.5 Safe Area `[Existing]`
모든 하단 고정 요소(`login-actions`, `home-case-nav`, `bottom-tabs`, `NAV_ITEM` 컨테이너)가 `max(Npx, env(safe-area-inset-bottom))` 패턴을 일관되게 사용한다. `[Recommended]` 새 하단 고정 UI를 만들 때 이 패턴을 그대로 재사용한다.

### 6.6 반응형 브레이크포인트 `[Existing]`
세대 ②(레거시)에만 미디어쿼리가 존재한다(globals.css:561-584):
- `max-width: 359px` — 초소형 화면 보정(패딩 축소, 일부 요소 숨김).
- `min-width: 800px` — 데스크톱에서 모바일 쉘을 점박이 배경 위 카드로 표현(`box-shadow: 8px 8px 0 #ded6cb`).
- `min-width: 1200px` — 데스크톱 좌측에 `.desktop-note`(로고+캐치프레이즈) 노출.
- `prefers-reduced-motion: reduce` — 전역 애니메이션/트랜지션 제거.

**`[Existing, 공백]`**: 세대 ③(확정 디자인) 화면들에는 이런 데스크톱 대응 미디어쿼리가 아직 없다 — 460px 쉘 폭을 넘는 화면에서 여백만 넓어질 뿐 레이아웃 자체는 적응하지 않는다. §19/§13에서 다시 다룬다.

---

## 07. Spacing

### 7.1 스케일 `[Existing]` (globals.css:105, design-system.ts:6)
```
4, 6, 8, 12, 16, 24, 32, 48 (px)
```
Tailwind 기본 스케일과 대체로 겹치지만 **6px**이 Figma 스펙에서 확정 추가된 값이다(globals.css:110 주석: *"spacing/xs·md·lg·xl·xxl(4/8/16/24/32)는 기존 값과 일치, sm(6)만 신규"*).

### 7.2 실제 사용 관례 `[Existing]`
- 스텝형 온보딩은 헤딩과 필드/옵션 사이에 **60px**의 넉넉한 여백(`step-fields`, `step-options`, globals.css:379-380) — 필드 하나짜리 화면일수록 여백을 과감히 준다.
- 버튼 세트 컨테이너 패딩이 맥락별로 다르게 사전 정의됨: `ButtonDefault`(화면 하단 CTA) = `px-4 py-6`, `ButtonPopup`(팝업 내부) = `p-2`.
- 카드/리스트 아이템 내부는 `gap-1.5`(6px), 아이템 간 간격은 `gap-2`(8px)가 반복된다(record-preview.tsx:324, :338).

### 7.3 `[Recommended]` 새 UI의 스페이싱 규칙
1. 위 8단계 스케일(4/6/8/12/16/24/32/48) 밖의 임의 px 값(예: 10px, 18px, 20px)을 새로 도입하지 않는다 — 단, 세대 ③ 코드에 이미 20px, 60px 같은 예외가 존재하므로(위 7.2), "화면 전체 리듬"을 만드는 큰 여백(섹션 간격, 헤딩-콘텐츠 간격)에 한해 예외를 허용하되 남용하지 않는다.
2. 화면 좌우 여백 16px, 카드/버튼 내부 패딩은 8~16px 범위, 리스트 아이템 간격은 8~12px을 기본값으로 삼는다.

---

## 08. Shape & Surface

**이것이 이 서비스 스타일의 핵심 지문이다.**

### 8.1 기본 규칙 `[Existing]`
- `--radius: 0px; --border-width: 2px;`(globals.css:106) — *"두꺼운 2px 잉크 테두리 + 각진 모서리"*(globals.css:111 주석).
- 테두리 색은 거의 항상 `#2b1f28`(순수 블랙이 아닌 톤 있는 잉크색).
- 그림자는 항상 오프셋 하드섀도, blur 반경 0: `2px 2px 0px 0px rgba(17,17,17,0.2)`, `1px 1px 0px rgba(0,0,0,0.2)`, 인풋은 `inset 0 2px 4px rgba(0,0,0,0.05)`(파인 느낌용 안쪽 그림자).
- 이미지 렌더링은 전역 `image-rendering: pixelated`(globals.css:154) — 확대해도 도트가 흐려지지 않는다.

### 8.2 컴포넌트별 Shape

| 요소 | radius | border | shadow | 근거 |
|---|---|---|---|---|
| 버튼(pixel-button) | 0 | 2px solid #2b1f28(primary), 1.6px solid white(secondary) | secondary만 `1px 1px 0 rgba(0,0,0,0.2)` | pixel-button/index.tsx |
| 인풋/텍스트영역 | 0 | 2px solid border-primary | inset 0 2px 4px rgba(0,0,0,0.05) | globals.css:292, :397 |
| 카드(step-option-card) | 0 | 2px solid text-primary | 없음(선택 시 그라디언트로 상태 표현) | globals.css:383 |
| 다이얼로그(dialog-window) | 0 | 2px solid white | `2px 2px 0px 0px rgba(17,17,17,0.2)` | dialog-window/index.tsx:4 |
| 바텀시트 | **4px 4px 0 0**(예외) | 1px solid border | 없음 | globals.css:253 |
| 아바타 커스터마이징 카드 | **16px**(예외) | 1px solid border-tertiary | 선택 시 `0 6px 6px rgba(0,0,0,0.08)` | globals.css:370-371 |
| 탭/칩(pill) | **9999px/999px**(예외) | 1px 또는 없음 | 없음 | globals.css:361, 407 |
| 색상 스와치 | **9999px**(예외) | 없음(선택 시 2중 outline-ring) | 선택 시 `0 0 0 2px white, 0 0 0 4px mint` | globals.css:367-368 |

### 8.3 캐릭터/Y2K 심미와의 연결 `[Existing→Recommended]`
각진 UI 크롬(창, 버튼, 카드) 안에 **둥글고 부드러운 캐릭터 스프라이트**가 대비를 이루는 구조다 — 딱딱한 "기계" 프레임 안에 살아있는 "생명체"가 들어있다는 대비가 다마고치 감성의 핵심이다. `[Recommended]` 새 화면에서 캐릭터/생물적 요소는 부드럽게, 그 캐릭터를 담는 UI 틀(프레임, 버튼, 다이얼로그)은 각지게 유지하는 대비를 의도적으로 지킨다.

### 8.4 예외 인벤토리(둥근 모서리가 허용되는 유일한 4곳) `[Existing]`
1. 바텀시트 상단 모서리(4px) — 끌어올리는 시트의 물리적 은유.
2. 아바타 커스터마이징 갤러리 카드(16px) — 캐릭터 꾸미기라는 부드러운 맥락에서만.
3. 알약형 탭/칩(9999px/999px) — 카테고리 전환용 소형 컨트롤.
4. 원형 색상 스와치(9999px) — 색상 자체가 원형이어야 자연스러운 경우.

**`[Recommended]`**: 이 4가지 외의 새 컨테이너(카드, 인풋, 버튼, 다이얼로그, 배너, 섹션 박스, 리스트 아이템)는 radius 0을 기본값으로 삼는다.

---

## 09. Components

### 9.1 Button `[Existing]`
- **레거시**([shared/ui/button](../shared/ui/button/index.tsx)): variant 4종(primary/secondary/ghost/danger), `min-h-11`, radius 0, `active:translate-x-px active:translate-y-px`로 눌림 피드백.
- **세대 ③**([shared/ui/pixel-button](../shared/ui/pixel-button/index.tsx)): `ButtonPrimary`(핑크 그라디언트+`▼`), `ButtonSecondary`(회청 배경), `ButtonDefault`(화면 하단 세트, `px-4 py-6`), `ButtonPopup`(팝업 내부 세트, `p-2`). 고정 높이 `42px`.
- **States**: `disabled:opacity-50 disabled:cursor-not-allowed`. **눌림(active) 피드백은 세대 ③에 없음** — §19 Design Debt.
- **새 화면 사용 규칙**: `[Recommended]` 버튼 2개 세트가 필요하면 직접 레이아웃을 짜지 말고 `ButtonDefault`/`ButtonPopup` 중 컨테이너 맥락에 맞는 것을 쓴다. 단일 버튼은 `ButtonPrimary`/`ButtonSecondary`.

### 9.2 Input / Textarea `[Existing]`
- 레거시 `TextField`: `border`, radius 0, `min-h-12`, 에러 시 `aria-invalid` + 빨간 테두리.
- 세대 ③ `field-box`/`login-field`/`step-textarea`: `border: 2px solid border-primary`, `box-shadow: inset 0 2px 4px rgba(0,0,0,0.05)`, `caret-color: accent-pink`(캐럿이 항상 핑크), placeholder는 `text-quinary`.
- **오토필 대응**(globals.css:310-329): 브라우저 자동완성 배경을 서비스 배경색으로 강제 오버라이드하는 CSS가 별도 존재 — 새 인풋도 이 패턴 재사용 필요.
- **2단 필드**(인풋+버튼 나란히, 예: 이메일 인증): `.login-field--row` + `.field-box`(flex:1) + 고정폭 80px 버튼.
- **커스텀 스크롤바** (아래 9.9 참고): 여러 줄 텍스트영역에 네이티브 스크롤바 대신 픽셀 스타일 트랙/썸을 그린다.

### 9.3 Card `[Existing]`
- 선택형 카드(`step-option-card`): 기본 흰 배경+2px 검정 테두리, 선택 시 `linear-gradient(180deg, white 0%, #accef3 55%, primary-blue 100%)`로 **색 반전이 아니라 그라디언트 침투**로 상태 전환.
- 데이터 카드(기록 아이템, record-preview.tsx:324): 흰 배경+2px 테두리+하드섀도, 상단에 점선(`border-dashed`) 구분선으로 메타(배지+날짜+삭제) / 본문을 분리.
- 커스터마이징 갤러리 카드(예외적 16px): §08.2 참고.

### 9.4 Dialog / Modal `[Existing]`
- 표준: [shared/ui/dialog-window](../shared/ui/dialog-window/index.tsx) — `max-w-[358px]`, `bg-[#d8dee9]`, `border-2 border-white`, 하드섀도, 중앙 텍스트+`ButtonPopup`.
- **미니 윈도우형 모달**: 캐릭터와 상호작용하는 팝업("집 놀러가기")은 알림창이 아니라 타이틀바+메뉴스트립을 포함한 **작은 프로그램 창 전체**로 구현(home-preview.tsx:448-551). `role="dialog" aria-modal="true"` 부여.
- 배경 딤은 항상 `bg-[#111] opacity-80`(레거시는 `rgba(0,0,0,0.5)+backdrop-blur`도 혼용).

### 9.5 Tab `[Existing]`
- 레거시 `BottomTabs`: 아이콘+라벨+활성 점.
- 세대 ③ 알약 탭(`avatar-style-tab`): 원형 pill, 선택 시 배경이 `text-primary`(거의 블랙)로 반전.
- **드래그 가능한 파일 탭**(profile-preview.tsx:400-424): 프로필 카드 카테고리 탭이 가로 드래그+모멘텀 스크롤을 지원하며, 드래그 중 발생한 클릭은 `onClickCapture`로 무효화한다("드래그 직후 클릭이 탭 전환으로 이어지지 않게"). `[Existing, 고급 패턴]` — 가로 스크롤 탭이 많아지는 새 화면에서 재사용 후보.

### 9.6 Character Bubble / Chat Bubble `[Existing]`
- 흰 배경 + 2px 잉크 테두리 + `drop-shadow(2px 2px 0px #2b1f28)` + 아래쪽 `▼` 꼬리(실제 삼각형이 아니라 **문자로 표현**, home-preview.tsx:336, :392, :484).
- 채팅 인풋은 실제 `<textarea>`를 자동 높이 조절(`scrollHeight` 측정, 1~2줄까지 커지고 이후 스크롤)하며, placeholder 대신 커스텀 오버레이 span + 깜빡이는 커서를 렌더링한다(포커스/값 유무에 따라 조건부 표시).

### 9.7 Memory / Record Item, Profile Card `[Existing]`
- 기록 아이템: `file 01` 형태의 순번 배지(생성일 오름차순 고정 인덱스, `buildBadgeMap`) + 핑크 톤 배지 배경(`#fce7f3`/`#f9a8d4`) + 날짜 + 인라인 삭제 버튼.
- 프로필 카드: 접기/펼치기 가능한 아코디언 아이템, 펼쳤을 때만 배경이 `--color-gray-quaternary`로 바뀌고 출처(`Ref. file XX`) 노출, 수정 모드 진입 시 인라인 textarea로 전환.
- **패턴**: 데이터 밀도가 높은 리스트는 장식을 최소화하고(하트/스파클 없음) 배지+타이포 위계만으로 스캔 가능성을 확보한다 — §10 하이어라키에서 다시 설명.

### 9.8 Toast / Notification / Empty State `[Existing]`
- Toast(레거시): `role="status" aria-live="polite" aria-atomic="true"`, 다크 배경(`--text`)+흰 텍스트.
- 세대 ③ 인라인 안내 배너: `bg-[#fce7f3] border-[#f9a8d4]` + 가운데 정렬 텍스트, 일정 시간 후 `window.setTimeout`으로 자동 소멸(record-preview.tsx:192-193).
- EmptyState(레거시): 스파클 아이콘 + 제목 + 설명, 점선 테두리 컨테이너. 세대 ③에는 단순 텍스트("아직 기록이 없어요")만 있는 경우도 있다(record-preview.tsx:340) — `[Recommended]` 신규 빈 상태는 최소한 아이콘+제목 정도는 유지해 레거시보다 빈약해지지 않게 한다.

### 9.9 커스텀 스크롤바(Canonical, 반복 발견) `[Existing]`
home-preview, record-preview, profile-preview 세 곳 모두 **동일한 자체 스크롤바 패턴**을 각자 구현하고 있다: `scrollbar-width: none`으로 네이티브 스크롤바를 숨기고, 6px 폭의 `bg-[#b0b8c1] border-l-2 border-[#2b1f28]` 트랙 위에 `top`/`height`를 JS로 계산한 흰 썸(`border-t-2 border-b-2`)을 절대 위치시킨다. `[Existing, 중복 구현]` 새 스크롤 가능 영역(긴 텍스트영역, 리스트)에 이 시각 언어를 재사용하되, 세 번째로 중복 구현하기보다 공용 훅/컴포넌트로 추출하는 것을 고려한다(§19).

### 9.10 Toggle `[Existing]`
`role="switch"`, 트랙은 각진 사각형(`radius: 0`), 썸은 `transition: transform var(--duration) var(--easing)`으로 `steps(2, end)` 이징을 사용 — 부드럽게 미끄러지지 않고 딱 끊기듯 이동한다(§11과 연결).

---

## 10. Character & Pixel Language

### 10.1 캐릭터 배치/스케일 `[Existing]`
- 캐릭터는 **항상 원형/사각 크롭 프레임 안에 퍼센트 기준으로 확대 배치**된다(`avatar-style-character-crop`, `home-case-character-crop`) — `overflow: hidden` 프레임 안에 이미지를 크게 얹어 "클로즈업" 구도를 만든다.
- 발밑에는 별도의 타원형 그림자 이미지(`minimi-shadow.svg`)가 항상 따로 렌더링된다(다마고치/포켓몬식 바닥 그림자).
- 캐릭터 주변에는 비대칭으로 배치된 반짝임(`✦` 문자, SVG 스파클)이 Y2K 감성을 더한다.

### 10.2 캐릭터 상태와 상호작용 `[Existing]`
- **애정 표현 3종**: 쓰다듬기(pat)/안아주기(hug)/뽀뽀하기(kiss) — 각각 전용 대사 풀(`AFFECTION_PHRASES`)에서 직전과 다른 문장을 랜덤 선택(`pickAffectionPhrase`)해 반복 클릭해도 매번 다른 반응을 준다.
- 반응 시 하트(`♥`) 3개가 서로 다른 `animationDelay`로 떠오르며 사라짐(`affectionHeartFloat`).
- 캐릭터 이름 호칭은 한글 받침 유무로 "야/아"를 자동 판별(`withVocative`) — 하드코딩 금지, 재사용 대상 유틸.

### 10.3 집/방/환경 `[Existing]`
- "집" 진입은 별도 팝업(미니 윈도우 전체)으로 처리되며, 배경 이미지(`bg-garden.png`, `room-bg.png`) 위에 캐릭터·말풍선이 절대 위치로 합성된다.
- 온보딩의 "완료" 팝업(`home-case*`)도 동일한 창 크롬을 재사용해 "집에 막 도착한" 느낌을 연출한다.

### 10.4 Pixel/Y2K 요소가 적용되는 곳 vs 아닌 곳 — 계층 정의 `[Recommended]`

**"픽셀아트니까 모든 UI를 픽셀화한다"는 규칙을 쓰지 않는다.** 대신 3단 위계로 구분한다:

| 계층 | 대상 | 처리 방식 | 근거 |
|---|---|---|---|
| **Tier 1 — 완전한 픽셀 아트** | 캐릭터 스프라이트, 방/정원 배경, 장식용 반짝임, 그림자 이미지, 아이템 아이콘 | 실제 도트 그래픽(PNG/SVG), `image-rendering: pixelated`, 크롭+줌 구도 | `[Existing]` `public/minimi/`, `public/setup/` 에셋 |
| **Tier 2 — 픽셀 지향 UI 크롬** | 버튼, 인풋, 카드, 다이얼로그, 창 타이틀바, 탭 | 실제 스프라이트가 아니라 **CSS로 각짐+2px 테두리+하드섀도+픽셀 폰트**를 구현한 "레트로 스킨" — 텍스처가 아니라 기하학과 타이포로 정체성을 냄 | `[Existing]` §06~08 |
| **Tier 3 — 정보 밀도 우선 영역** | 기록/프로필 리스트, 법적 동의 문구, 폼 유효성 메시지 | 픽셀 폰트는 유지하되 장식(스파클, 그라디언트, 애니메이션)을 걷어내고 스캔 용이성 우선 | `[Existing]` §09.7의 기록/프로필 아이템, requiredConsentItems 상세 문구 |

**적용 규칙**: 화면을 새로 만들 때 "이 요소가 감정적 순간(캐릭터와의 상호작용)인가, 구조적 UI(입력/이동)인가, 정보 소비(목록 읽기)인가"를 먼저 정하고 해당 Tier의 처리 강도를 적용한다. Tier 1의 화려함을 Tier 3(리스트)에 그대로 가져오면 과잉 장식이 되고, Tier 2의 절제를 Tier 1(캐릭터 씬)에 가져오면 밋밋해진다.

---

## 11. Interaction & Motion

### 11.1 타이밍 원칙 `[Existing]`
- `--duration: 120ms; --easing: steps(2, end);`(globals.css:107) — **부드러운 트랜지션이 아니라 딱딱 끊어지는 스텝 전환**이 원칙.
- 로딩 인디케이터: `animation: pixel-pulse 1s steps(2, end) infinite`(점 3개 깜빡임, 스피너 회전 아님).
- 커서 깜빡임: `steps(1, end)`.
- 토글 썸 이동: `transition: transform var(--duration) var(--easing)`.

### 11.2 예외: 캐릭터/감정 표현은 부드럽게 `[Existing]`
애정 하트 파티클(`affectionHeartFloat`)만 유일하게 `ease-out`을 쓴다 — **UI 상태 전환에는 steps(), 캐릭터의 "살아있는" 움직임에는 ease** 라는 구분이 코드에 이미 존재한다.

### 11.3 Hover/Active/Focus `[Existing]`
- Hover: 색상 자체를 바꾸기보다 `hover:brightness-95/90`(밝기 변화) 위주 — 저비용/저노이즈 피드백.
- Active(레거시 버튼): `active:translate-x-px active:translate-y-px` — 그림자만큼 실제로 이동해 눌림 표현. **세대 ③ 버튼엔 이 피드백이 없음**(§19).
- Focus: `:focus-visible { outline: 3px solid var(--info); outline-offset: 4px; }` — 전역 적용, 키보드 포커스만 표시(마우스 클릭 시 미표시).

### 11.4 드래그/스와이프 `[Existing, 고급]`
프로필 카테고리 탭의 가로 드래그+모멘텀 스크롤(§09.5) — `pointerdown/move/up` 샘플링으로 속도를 계산해 관성 스크롤을 구현하고, 드래그 후 발생하는 오탐 클릭을 캡처 단계에서 차단한다. `[Recommended]` 가로 스크롤 탭/리스트가 필요한 새 화면에서 이 패턴(속도 계산+모멘텀+클릭 무효화)을 참고한다.

### 11.5 접근성과의 접점 `[Existing]`
`@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }`(globals.css:582-584) — 전역으로 모든 애니메이션을 끄는 스위치가 이미 있다. `[Recommended]` 새 애니메이션을 CSS `animation`/`transition`으로 구현하면 이 규칙이 자동 적용되므로, JS로 직접 스타일을 애니메이션하는 방식(예: `requestAnimationFrame`으로 위치를 계속 갱신)은 피하거나 별도로 `prefers-reduced-motion`을 체크한다.

### 11.6 `[Recommended]` 사용 기준
- **적극 사용**: steps() 기반 상태 전환, 밝기 기반 hover, 캐릭터 반응성(랜덤 대사+파티클), 자동 높이 조절 텍스트영역.
- **피해야 할 것**: 일반 SaaS의 부드러운 fade-in/slide-up 페이지 전환, 우아한 `cubic-bezier` 이징을 UI 크롬에 쓰는 것, 과도한 parallax, 로딩에 회전 스피너 사용(이 서비스는 점 깜빡임을 쓴다).

---

## 12. Content & Voice

### 12.1 톤 구분 `[Existing]`
- **시스템 메시지(토스트/에러/안내)**: 해요체 — "코드를 복사했어요", "회원가입이 완료됐어요", "기록이 삭제됐어요".
- **캐릭터 대사**: 반말+느낌표 — "헤헷 쓰담쓰담 좋아!", "얼굴이 빨개졌어 >_<", "두근두근 설레어!".
- **법적/민감 정보(약관 동의)**: 예외적으로 격식체·긴 문장(`requiredConsentItems`) — 캐주얼한 톤을 유지하지 않는다.

### 12.2 이모지 대신 기호 `[Existing]`
이모지(😊 등)는 코드 어디에도 등장하지 않는다. 대신 `♥`, `▼`, `✦`, `>_<` 같은 아스키/기호 문자로 감정을 표현한다. 유일한 예외는 레거시(세대 ①) `.soft-bubble--top::before { content: '💙'; }`(globals.css:551) — **이건 가장 오래된 프로토타입 잔재이며 신규 화면에서 참고하지 않는다.**

### 12.3 호칭 처리 `[Existing]`
`withVocative()`(home-preview.tsx:52-59)가 한글 받침 유무로 "지수야"/"민준아"를 자동 생성 — 새 화면에서 캐릭터 대사에 상대 이름을 넣을 때 이 유틸을 재사용한다.

### 12.4 버튼/CTA 라벨 `[Existing]`
짧고 행동 지향적: "다음 ▶", "확인", "삭제하기", "취소". 완곡한 확인 질문("정말 삭제하시겠습니까?")은 버튼이 아니라 다이얼로그 본문에 넣고, 버튼 자체는 동사 단독으로 끝낸다.

### 12.5 Voice & Tone 요약 `[Recommended]`
- 친근하다: O (해요체 기본)
- 장난스럽다: 캐릭터 대사에 한해 O, 시스템 메시지는 X
- 연인에게 말하듯 한다: 캐릭터 대사만 해당, 시스템 메시지는 서비스가 사용자에게 말하는 톤
- 짧은 문장: O — 특히 버튼/배지/캡션
- 이모지: X — 기호(♥▼✦)로 대체
- AI스럽거나 공식적인 표현: X, 단 법적 고지 영역은 예외적으로 격식체 허용

---

## 13. Responsive Design

### 13.1 Mobile-first 여부 `[Existing]`
그렇다 — 기준 디자인은 390px(§06.1), 데스크톱은 "쉘을 460px로 고정하고 남는 공간은 배경 처리"하는 방식으로 대응한다(§06.6의 800px/1200px 브레이크포인트, 단 세대 ②에만 존재).

### 13.2 터치 타겟 `[Existing]` + `[Recommended]`
- 레거시 버튼/토글은 `min-h-11`(44px)를 지키는 곳이 많다(button/index.tsx:10, toggle 44px 등).
- 세대 ③ `pixel-button`은 고정 높이 `42px` — iOS 권장 44px에 근소하게 못 미친다. `[Recommended]` 새 버튼을 42px로 맞추는 기존 관례를 따르되, 터치 정확도가 중요한 1차 CTA는 44px로 올리는 것도 검토 가능(단, 기존 42px 통일성과 트레이드오프이므로 임의로 바꾸지 않는다).

### 13.3 캐릭터/이미지 스케일링 `[Existing]`
캐릭터 크롭 프레임은 고정 px 크기(`98px×137px`, `220px×220px` 등)로 지정돼 있고 뷰포트에 비례해 스케일링되지 않는다. `[Recommended]` 460px 쉘 안에서는 문제 없으나, 320px 최소 뷰포트에서 여백이 타이트해질 수 있으므로 새 캐릭터 노출 영역을 만들 때 최소 뷰포트(320px) 기준으로 잘림 여부를 확인한다.

### 13.4 오버플로우 처리 `[Existing]`
- 텍스트 영역: `overflow-y-auto` + 커스텀 스크롤바(§09.9).
- 리스트: `overflow-y-auto` + `pb-[Npx]`로 하단 고정 UI와의 겹침 방지.
- 가로 스크롤: 탭 목록에 한해 `overflow-x-auto` + 드래그(§11.4).

### 13.5 `[Recommended]` 새 반응형 규칙
1. 460px 쉘 폭을 기준으로 먼저 설계하고, 320px에서 잘리는 요소가 없는지 확인한다.
2. 세대 ③ 화면에는 아직 데스크톱 전용 스타일이 없으므로, 새 화면에서 데스크톱 대응이 필요하면 세대 ②의 800px/1200px 브레이크포인트 관례(점박이 배경+카드 그림자, 좌측 캐치프레이즈)를 참고하되 픽셀 정체성에 맞게 조정한다.
3. safe-area 대응은 하단 고정 요소마다 예외 없이 넣는다.

---

## 14. Accessibility

### 14.1 현재 확인되는 패턴 `[Existing]`
- `:focus-visible { outline: 3px solid var(--info); outline-offset: 4px; }` — 전역 키보드 포커스 표시.
- `role="dialog" aria-modal="true"` — 모든 커스텀 팝업/다이얼로그.
- `role="status" aria-live="polite" aria-atomic="true"` — 토스트.
- 네이티브 `<dialog>` + `showModal()` — 포커스 트랩, `Escape`/`onCancel` 처리, 닫힐 때 이전 포커스 복원(bottom-sheet/index.tsx:11-16).
- `aria-current="page"` — 활성 탭 표시(BottomTabs).
- `aria-pressed` — Chip 선택 상태.
- `role="switch"` — Toggle.
- `aria-invalid` + `aria-describedby` — TextField 에러 연결.
- `sr-only` 클래스 — 시각적으로 숨긴 네이티브 체크박스(동의 항목 등)를 커스텀 아이콘과 함께 접근 가능하게 유지.
- 장식 이미지는 `aria-hidden="true"` + 빈 `alt=""`, 의미 있는 이미지는 서술적 `alt`(예: `alt="연인 미니미 미리보기"`, `alt={`${partnerName} 미니유`}`)로 구분.
- `-webkit-tap-highlight-color: transparent` + 별도 hover/active 피드백으로 대체.
- `prefers-reduced-motion: reduce` 전역 대응(§11.5).

### 14.2 최소 유지 기준 `[Recommended]`
새 컴포넌트를 만들 때 최소한 다음을 지킨다:
1. 커스텀 인터랙티브 요소(div로 만든 버튼 등)에는 반드시 `role`/`aria-*`와 키보드 접근성을 부여한다.
2. 장식 이미지는 `aria-hidden`+빈 alt, 의미 전달 이미지는 서술적 alt.
3. 모달류는 `role="dialog" aria-modal="true"` + 포커스 트랩(가능하면 네이티브 `<dialog>` 우선).
4. 색만으로 상태를 구분하지 않는다(현재도 선택 상태를 그라디언트+테두리+링 등 복수 신호로 표현하고 있음 — 이 관례를 유지).
5. 새 애니메이션은 CSS로 구현해 `prefers-reduced-motion` 전역 규칙의 혜택을 자동으로 받게 한다.

### 14.3 균형점 `[Recommended]`
- 픽셀 폰트의 작은 사이즈(10~12px)는 저시력 사용자에게 불리할 수 있다 — 그렇다고 폰트를 sans-serif로 바꾸거나 무작정 사이즈를 키우진 않는다. 대신 **줄 간격(line-height)과 대비(contrast)는 타협하지 않는다**(현재 코드도 body 텍스트는 150% 줄간격을 유지하고 있음).
- 버튼 높이 42px(§13.2)처럼 시각적 정체성과 44px 권장치가 충돌할 때는, 임의로 서비스 정체성(고정 높이 42px 통일감)을 깨지 말고 사용자와 논의 후 결정한다.

---

## 15. Technical Implementation

### 15.1 CSS 아키텍처 `[Existing]`
- **Tailwind v4** — `@import "tailwindcss";`만 있고 `tailwind.config.*` 파일이 없다(v4의 CSS-first 설정 방식). 커스텀 토큰은 `@theme { ... }` 블록에서 CSS 변수를 Tailwind 유틸로 매핑한다(globals.css:29-44, 예: `--color-miniu-primary: var(--primary);` → `bg-miniu-primary`).
- **디자인 토큰의 진실 소스는 `globals.css`의 `:root`** — `shared/config/design-system.ts`는 프리뷰 레지스트리용 이름 목록일 뿐 값을 갖지 않는다(주석으로 명시).
- 신규 화면은 Tailwind arbitrary value(`bg-[#d8dee9]`, `text-[color:var(--color-text-primary)]`)와 등록된 커스텀 유틸(`bg-miniu-primary`, `.text-display-l` 등)을 섞어 쓴다.

### 15.2 네이밍 컨벤션 `[Existing]`
- 레거시(세대 ①②) CSS 클래스: kebab-case + BEM 유사 수식자(`is-selected`, `is-disabled`, `--variant` 접미사, 예: `.step-option-card--invite`).
- 세대 ③: 화면 내부에서는 Tailwind 유틸 클래스 위주, 반복되는 조합만 JS 상수로 추출(`TITLE_BAR`, `WINDOW_BTN`, `NAV_ITEM` — 각 위젯 파일 상단에 개별 정의).
- 상태 접미사는 `is-selected`, `is-active`, `is-disabled`로 통일돼 있다 — 새 CSS 클래스를 추가한다면(가급적 지양, §15.1) 이 접미사 관례를 따른다.

### 15.3 CSS 우선순위 함정 (반드시 인지할 것) `[Existing, 기술 부채]`
`globals.css`의 전역 베이스 스타일 중 unlayered로 선언된 것들이 Tailwind 유틸리티 레이어보다 우선순위가 높아, 클래스로 덮어쓸 수 없는 경우가 두 번 발견됐다:
1. `button, input { font: inherit }` → 버튼에 준 `font-pixel` 유틸이 씹힘(globals.css:142-145 주석) → `.miniuButton`처럼 커스텀 클래스에 재명시하거나 인라인 스타일로 우회.
2. `button { color: inherit }`(암묵) → 탭 활성 텍스트 색(`text-white` 등)이 씹힘 → profile-preview.tsx:415-418에서 `style={{ color: "var(--color-common-100)" }}`로 인라인 강제.

`[Recommended]` 새 버튼/인터랙티브 요소에 Tailwind의 `font-*`/`text-*`(색상) 유틸이 반영되지 않는 것처럼 보이면, 이 전역 규칙과의 충돌을 먼저 의심하고 인라인 스타일 또는 더 구체적인 커스텀 클래스로 우회한다 — 버그가 아니라 알려진 특이 케이스다.

### 15.4 컴포넌트 아키텍처 `[Existing]`
FSD(Feature-Sliced Design)류 폴더 구조: `shared/ui`(범용 프리미티브), `entities`(도메인 표현 컴포넌트), `widgets`(화면 단위 조합), `app`(라우트). `[Recommended]` 새 화면도 이 계층을 따른다 — 재사용 가능한 시각 요소는 `shared/ui`에, 도메인 특화 표현은 `entities`에, 화면 전체 조합은 `widgets`에 둔다.

### 15.5 폰트/에셋 관리 `[Existing]`
- 폰트: `public/fonts/{dunggeunmo,silkscreen}/`, `@font-face` + woff2, 라이선스 README 동봉.
- 이미지: `public/minimi/`(캐릭터/집 관련), `public/setup/`(온보딩 장식), `public/login/`(로그인 배경/장식) — 폴더가 기능별로 분리돼 있다. `[Recommended]` 새 에셋도 이 네이밍 관례(`bg-*`, `nav-*`, `window-btn-*`)를 따르고 임의 위치에 새 폴더를 만들지 않는다.

---

## 16. Canonical Patterns (우선 재사용 대상)

새 화면 작업 시작 전 아래 목록에서 조합 가능한 패턴이 있는지 먼저 확인한다.

1. **3단 그라디언트 배경** — `primary-blue → secondary-blue → common-100`, 세로. "주요 화면"임을 알리는 시그니처.
2. **창(window) 크롬** — 타이틀바(그라디언트 파랑+실행파일풍 텍스트) + 메뉴스트립("파일(F) 동작(A)...") + winbtn 3개. 캐릭터 상호작용 팝업/기록 작성 팝업에서 재사용.
3. **다이얼로그(dialog-window) 패밀리** — 딤 배경 + 회청 패널(`#d8dee9`) + 흰 테두리 + `ButtonPopup`. 확인/경고성 팝업 전용.
4. **선택형 옵션 카드** — 기본 각진 흰 카드, 선택 시 그라디언트 침투(색 반전 아님).
5. **커스텀 픽셀 스크롤바** — 트랙(회색+왼쪽 진한 테두리) + JS 계산 썸(흰색+위아래 테두리). 긴 텍스트영역/리스트에서.
6. **파일 배지("file 01")** — 생성 순서 고정 인덱스 + 핑크 톤 배지. 데이터 항목 참조 표시용.
7. **캐릭터 클로즈업 스테이지** — 원형/사각 크롭 프레임 + 퍼센트 확대 이미지 + 바닥 타원 그림자 + `▼` 꼬리 말풍선.
8. **하단 고정 CTA/네비 + safe-area** — `position: fixed` + `max(Npx, env(safe-area-inset-bottom))`.
9. **호칭 자동 생성** — `withVocative()` 유틸 재사용, 하드코딩 금지.
10. **드래그 가능한 가로 탭** — 속도 샘플링 기반 모멘텀 스크롤 + 클릭 오탐 방지.

---

## 17. Do / Don't

### Do `[Existing→Recommended]`
- ✅ radius 0을 기본값으로, 예외는 §08.4의 4가지로 한정.
- ✅ 2px 잉크 테두리(`#2b1f28`) + blur 없는 오프셋 하드섀도.
- ✅ DungGeunMo/Silkscreen 픽셀 폰트만 사용.
- ✅ 세로 그라디언트 버튼(핑크: 주요 CTA, 파랑: 보조 CTA성 상호작용, 회청: 중립 보조 버튼).
- ✅ 핑크는 애정/하트 전용, 선택 상태는 민트 링, 링크 텍스트는 블루.
- ✅ 460px 쉘 + 좌우 16px 고정 여백.
- ✅ 하단 고정 요소마다 safe-area 대응.
- ✅ UI 크롬 애니메이션은 `steps()`, 캐릭터/감정 표현은 `ease`.
- ✅ 이모지 대신 기호(♥ ▼ ✦)와 캐릭터 대사로 감정 전달.
- ✅ 세대 ③ 패턴(Tailwind + Figma 토큰)만 새 화면에 사용.

### Don't `[Recommended]` (사용자 요청 검토 항목 포함, 현재 코드 사용 여부 기준으로 판단)
- ❌ **Generic SaaS 대시보드류 UI** — 표/필터/사이드바 내비게이션 등 정보 관리형 레이아웃. 이 서비스에 없고 컨셉과도 충돌.
- ❌ **Generic AI 챗봇 UI**(말풍선 좌우 정렬 + 회색/파랑 표준 채팅 UI) — 현재 채팅 UI는 캐릭터가 있는 창(window) 스테이지 안에 통합돼 있으며 일반 챗봇처럼 좌우 대화 리스트로 흐르지 않는다. 새 채팅형 기능도 이 창 은유를 유지한다.
- ❌ **Glassmorphism(과도한 블러+반투명)** — 코드에 `backdrop-filter: blur`가 딤 배경 등 극히 제한적으로만 쓰이고(팝업 오버레이), 카드/버튼 표면에는 전혀 없다. 새 화면에 유리질 카드 효과를 도입하지 않는다.
- ❌ **무분별한 그라디언트** — 단, 이 서비스는 **의도된 3단 배경 그라디언트**와 **버튼 세로 그라디언트**를 캐노니컬 패턴으로 이미 쓰고 있다(§16-1, Do 항목). "무분별함"이 금지 대상이지 그라디언트 자체가 금지 대상이 아니다 — 새로운 임의의 그라디언트 조합(예: 45도 대각선 화려한 다색 그라디언트)을 추가하는 것을 피한다.
- ❌ **과도한 rounded card** — §08.4의 4가지 예외 외 라운드 남용.
- ❌ **서비스와 무관한 최신 UI 트렌드**(뉴모피즘, bento grid, 3D 틸트 카드 등) — 레트로 픽셀 정체성과 충돌.
- ❌ **디자인 시안이 없다는 이유로 기본 HTML/CSS 스타일로 구현** — 시안이 없을수록 이 문서의 토큰/패턴을 더 엄격히 따른다.
- ❌ **화면마다 다른 디자인 언어** — 세대 ①②③ 중 아무거나 섞어 쓰지 않는다. 새 화면은 예외 없이 세대 ③.
- ❌ **과도하게 많은 장식** — Tier 3(정보 밀도 리스트, §10.4)에 스파클/그라디언트/파티클을 남용하지 않는다.
- ❌ 순수 블랙(`#000`)이나 팔레트 밖의 원색을 테두리/텍스트에 쓰는 것.
- ❌ `app/globals.css`의 세대 ①② 클래스(`.mock-phone`, `.room`, `.mail-*`, `.choice-list`, `.code-card` 등)를 새 화면에 이식하는 것.
- ❌ 좌우 여백을 화면마다 다른 px 값으로 하드코딩하거나 컨텐츠 wrapper에 임의 `max-width`를 지정하는 것.

---

## 18. AI Design Decision Rules

새 화면을 시안 없이 설계해야 할 때, 아래 우선순위로 판단한다(사용자 지정 순서를 그대로 채택).

1. **기존 디자인 시스템**(§04~08의 토큰: 색/타이포/스페이싱/셰이프) — 여기서 값을 먼저 찾는다. 없는 값을 새로 만들지 않는다.
2. **기존 컴포넌트**(§09, §16 Canonical Patterns) — `pixel-button`, `dialog-window`, `.text-*` 유틸, `login-*`/`step-*` 관례 중 조합 가능한 것을 우선 재사용한다.
3. **기존 사용자 경험**(§01의 온보딩 서사, 탭 구조, 상호작용 흐름) — 새 기능이 기존 흐름의 어느 지점에 붙는지 먼저 판단한다.
4. **서비스 컨셉**(§01~03: 레트로 픽셀 다마고치, 관계 기록 의식) — "이게 이 서비스라면 어울리는가"를 자문한다.
5. **새 화면의 기능적 목적**(정보 입력/소비/상호작용 중 무엇인가) — §10.4의 Tier 분류로 장식 강도를 결정한다.
6. **감정적 경험**(§01의 4대 감정, §02 원칙) — 특히 캐릭터가 관여하는 화면인지 확인한다.
7. **시각적 참신함** — 가장 마지막 우선순위. 위 6가지로 해결되지 않는 새로운 UX 문제가 있을 때만, §02/§08의 제약(각짐/2px 테두리/하드섀도/픽셀폰트) 안에서 새로운 시각 표현을 제안한다.

**판단 순서**: "새롭고 예쁜 디자인"이 아니라 "기존 서비스와 자연스럽게 연결되는 디자인"을 우선한다. 다만 기존 패턴이 해결하지 못하는 새 UX가 실제로 있다면(예: 완전히 새로운 상호작용 유형), 서비스 컨셉을 유지하는 범위 안에서 새 디자인을 제안할 수 있다 — 이때도 §04~08의 토큰과 §02의 원칙은 반드시 준수한다.

**의사결정 트리(요약)**:
```
새 화면/컴포넌트 필요
 └─ §16 Canonical Patterns에 맞는 조합이 있는가?
     ├─ Yes → 그대로 재사용
     └─ No → §09 기존 컴포넌트를 조합할 수 있는가?
         ├─ Yes → 조합해서 구성
         └─ No → §04~08 토큰 안에서 새 컴포넌트 설계
             └─ 완성 후 §17 Do/Don't, §14 접근성 최소 기준으로 검토
```

---

## 19. Design Debt

솔직하게 발견한 문제만 기록한다. 판단(고칠지, 어떻게 고칠지)은 사용자 몫이다.

1. **세 개의 UI 세대 공존** `[Existing, 신규 발견]` — 이전 분석에서는 2세대만 파악됐으나, `widgets/setup-preview`가 완전히 별개인 카카오톡풍 목업(세대 ①)임을 이번에 확인했다. 한 저장소 안에 서로 다른 시각 언어 3벌이 있어 신규 합류자(또는 AI)가 실수로 잘못된 세대를 참고하기 쉽다. → 새 화면은 반드시 세대 ③만 참고(§03).
2. **danger/success/warning 시맨틱 컬러 공백** `[Existing]` — Figma 변수 자체가 없어 에러 표시에 핑크(애정색)를 재사용 중. 파괴적 액션이 늘어나면 "위험"과 "애정"이 같은 색이라는 혼동 소지.
3. **Mint/Blue 액센트가 토큰화되지 않음** `[Existing]` — `#22d3ee`, `#1d4ed8`가 실사용 중이지만 `:root` 변수가 아니라 컴포넌트에 하드코딩돼 있다. 새 화면에서 재사용 시 값이 파편화될 위험.
4. **Background/Gray 값 불일치 가능성** `[Existing, 검증 필요]` — 사용자 제공 Figma 값(`#DBDEE9`)과 코드 값(`#d8dee9`)이 다르다. 이 세션에서 Figma 라이브 조회가 실패해 확정하지 못했다 — 실제 Figma 파일을 열어 직접 대조 확인 필요.
5. **버튼 눌림(active) 피드백 비일관** `[Existing]` — 레거시 버튼엔 `active:translate` 눌림 효과가 있지만 세대 ③ `pixel-button`엔 없다. 촉각적 일관성이 세대 간 끊긴다.
6. **아이콘 구현 3원화** `[Existing]` — `shared/ui/icon`의 stroke SVG, 같은 파일의 fill 기반 픽셀 SVG, 그리고 `home-preview.tsx` 등의 수십 개 `<span>` 절대위치 조합 아이콘까지 세 가지 구현 방식이 섞여 있어 유지보수 비용이 크다.
7. **커스텀 스크롤바 로직 3중 중복** `[Existing]` — home-preview, record-preview, profile-preview가 픽셀 스크롤바(§09.9)를 각자 독립적으로 재구현했다. 공용 훅/컴포넌트 추출 여지.
8. **하단 네비게이션(`NAV_ITEM`) 3중 중복** `[Existing]` — 위와 동일한 이유로 세 위젯에 거의 동일한 상수/마크업이 반복된다.
9. **JS 설정과 CSS 진실 소스의 이중화** `[Existing]` — `design-system.ts`가 이름만 나열하고 실제 값은 `globals.css`에만 있다(주석이 이미 이 이중화를 인지). 두 파일이 어긋나면(새 컬러가 CSS에만 추가되고 TS 목록 누락) 프리뷰 레지스트리가 조용히 stale해질 수 있다.
10. **세대 ③에 데스크톱 브레이크포인트 없음** `[Existing]` — 세대 ②에만 800px/1200px 미디어쿼리가 있고, 확정 디자인(세대 ③) 화면은 460px를 넘는 뷰포트에서 여백만 늘어날 뿐 별도 대응이 없다.
11. **버튼 높이 42px vs 접근성 권장 44px** `[Existing]` — §13.2 참고, 트레이드오프이므로 임의 변경하지 않는다.
12. **CSS 특이도 함정으로 인한 인라인 스타일 우회** `[Existing]` — §15.3의 두 사례처럼 전역 unlayered 스타일 때문에 Tailwind 유틸이 무시되는 경우, 매번 인라인 스타일로 우회하고 있다. 근본 해결(전역 규칙을 레이어드로 옮기거나 더 구체적으로 스코프)은 검토 대상.

---

## 20. Future Direction

**전제**: 아래는 "현재 디자인 DNA를 유지하면서 확장할 경우"의 방향이지, 확정된 디자인 결정이 아니다. `[Recommended]`

1. **새 기능 영역(설정, 알림함, 아이템 상점 등)은 세대 ③의 창(window) 크롬을 기본 틀로 확장한다** — 이미 홈/기록/프로필이 공유하는 타이틀바+메뉴스트립 문법을 새 도메인에도 적용하면 서비스 전체의 일관성이 유지된다.
2. **캐릭터 커스터마이징 문법(탭+색상 스와치+선택 카드)을 "커스터마이저" 공용 패턴으로 승격할 여지가 있다** — 헤어/의상 선택에 쓰인 구조는 향후 "집 꾸미기", "아이템 장착" 등에도 그대로 재사용 가능한 형태다.
3. **중복 구현(스크롤바, 하단 네비, 아이콘)을 공용 컴포넌트/훅으로 정리하는 리팩터링은 신규 화면이 늘어날수록 이득이 커진다** — 지금 새로 셋째, 넷째 위젯을 만들 때마다 같은 코드를 또 복붙하지 않도록 주의한다.
4. **Mint/Blue 액센트를 정식 토큰화하면 "선택 상태"와 "링크 텍스트"라는 이미 확립된 역할을 서비스 전역에서 일관되게 확장할 수 있다.**
5. **세대 ①②(레거시 프리뷰/최초 프로토타입)는 신규 기능이 세대 ③으로 이관될수록 자연스럽게 축소되어야 한다** — 새 코드가 레거시를 새로 참조하는 일이 없도록 하는 것이 축소의 시작이다.
6. **접근성 기반(포커스 표시, reduced-motion, ARIA 롤)은 이미 준수 수준이 나쁘지 않으므로, 새 화면에서 이 기준 이하로 떨어지지 않게 유지하는 것이 확장의 전제 조건이다.**
