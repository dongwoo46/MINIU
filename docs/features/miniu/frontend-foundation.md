# MINIU 프론트엔드 기본틀 인계

## 목적과 범위

이 작업은 Figma에서 확인한 모바일 화면을 바탕으로 프론트엔드의 확장 가능한 기본틀과 임시 디자인 시스템을 만든다. `docs/features/miniu/prd.md`, `docs/features/miniu/spec.md`가 제품 동작의 기준이며, 이 문서는 별도 PRD나 기술설계를 추가하지 않는 구현 인계 문서다.

이번 범위는 홈·문자·프로필 로컬 프리뷰 3개와 공통 UI 샘플까지다. API, 브라우저 저장소, 인증, 라우팅 가드, AI, 문자 송수신, 미니유 생성·커스텀 등 실제 기능은 연결하지 않는다. 화면 문구는 MINIU 기준으로 교체하고 이전 "나를 믿는 종교/AI 경전" 컨셉은 제거한다.

## 구조와 의존 방향

```text
app/
  page.tsx
  layout.tsx
  globals.css
widgets/
  mobile-shell/
  home-preview/
  letter-preview/
  profile-preview/
entities/
  minimi/
  profile-card/
  letter/
shared/
  config/design-system.ts
  ui/
    button/ chip/ badge/ surface/ top-bar/ bottom-tabs/
    bottom-sheet/ text-field/ empty-state/ loading/ toggle/ toast/ icon/
public/
  fonts/ icons/ minimi/
```

의존 방향은 `app → widgets → entities → shared`로만 흐르게 한다. 위 계층은 아래 계층의 공개 진입점에서 가져오고, 위젯과 엔티티는 각 폴더의 `index.ts`를 공개 진입점으로 둔다. 공통 UI는 `shared/ui/<component>` 단위로 나누며 제품 데이터나 화면별 문구를 갖지 않는다.

프리뷰 전용 mock은 각 `widgets/*/model`에 둔다. 엔티티에는 표현 가능한 타입과 재사용 UI만 두고, 한 프리뷰를 위한 배열이나 사용자 예시는 올리지 않는다. 실제 기능을 붙일 때 mock 호출부를 해당 feature 또는 데이터 계층의 공개 인터페이스로 교체한다.

## 디자인 시스템

`app/globals.css`에 리셋과 CSS 변수를 둔다. 팔레트는 Figma 확정 전 임시값이므로 컴포넌트에 색상 리터럴을 반복하지 말고 의미 토큰만 사용한다.

- 색상: 배경, 보조 배경, 표면, 테두리, 기본·보조·반전 텍스트, primary와 상태별 success/warn/danger/info
- 타이포그래피: 시스템 폰트 우선, 제목·본문·라벨·캡션 단계
- 간격: `4, 8, 12, 16, 24, 32, 48px`
- 모서리: `0` 또는 작은 값과 계단형 표현
- 그림자: 픽셀 UI에 맞는 단단한 오프셋
- 모션: 짧은 지속시간과 `steps()` 중심, `prefers-reduced-motion` 대응
- 레이아웃: 최소 `320px`, Figma 기준 `390px`, 콘텐츠 최대 `460px`, 라이트 테마 우선

`shared/config/design-system.ts`는 코드에서 재사용할 `designSystem`, `previewTabs`, `previewCategories`를 내보낸다. `previewTabs`는 `home / letter / profile`, `previewCategories`는 `전체 / 음식 / 취미 / 취향 / 관심사`이며 둘 다 현재 샘플 탐색용이다. 특히 프리뷰 카테고리는 PRD의 프로필 카드 5종인 `좋아하는 것 / 싫어하는 것 / 가치관 / 습관 / 성향`을 바꾸거나 대신하지 않는다. 실제 프로필 기능 구현 시 PRD 카테고리를 별도 도메인 모델로 정의한다.

기본 공통 UI 등록 대상은 button, chip, badge, surface, top-bar, bottom-tabs, bottom-sheet, text-field, empty-state, loading, toggle, toast, icon이다. 현재 화면에서 사용하는 변형만 구현하고, 사용하지 않는 복합 상태나 완성 화면을 미리 만들지 않는다.

## 프리뷰와 에셋

`app/page.tsx`는 다음 세 로컬 프리뷰를 전환해 확인하는 진입점이다.

1. 홈: “오늘도 놀러왔네!”, “진우의 집”, 미니유 자리, “진우와 대화를 해보세요” 입력, 하단 탭
2. 문자: 도착 문자 목록, “문자가 도착했어요”, “소영아 오늘 카페 갔는데...”, “문자 쓰기” 버튼
3. 프로필: “연인 / 최진우”, 프리뷰 카테고리 칩, 정보 카드 3개, “추가하기” 버튼

미니유 자리는 코드에 포함된 SVG로 그린 임시 캐릭터를 사용한다. 외부 폰트나 이미지 에셋은 받지 않는다. 이후 원본 에셋을 받을 때 글꼴은 `public/fonts/`, 독립 SVG 아이콘은 `public/icons/`, 캐릭터·배경·스프라이트는 `public/minimi/`에 둔다. 원본 해상도를 유지하고 픽셀 이미지는 `image-rendering: pixelated`를 적용한다. 파일명은 소문자 kebab-case로 통일하고 라이선스와 출처를 함께 기록한다.

## 확장과 검증

새 화면은 먼저 기존 `shared/ui`와 `entities`로 조합하고, 화면 단위 조합은 새 `widgets/<name>`에 둔다. 공통화는 두 곳 이상에서 같은 역할이 확인된 뒤 진행한다. 실제 데이터가 들어오면 위젯의 `model` mock을 제거하고 로딩·빈 상태·실패·재시도 규칙을 `spec.md`에 맞춰 연결한다.

구현 후 아래 명령을 실행한다. 이 문서는 명령 실행 성공을 전제로 하지 않으며 결과는 구현 인계 시 별도로 보고한다.

```bash
npm run lint
npm run typecheck
node tools/docs.js check
```
