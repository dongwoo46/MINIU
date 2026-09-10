# 사이드프로젝트 AI 작업 규칙

이 저장소는 2인이 AI 해커톤 규모로 사용한다. 팀 조직, 결재, Slack, 제안서 원장, 별도 QA 문서 체계를 만들지 않는다.

## 모델 배분

- 상위기획, PRD, 기능명세, 기술설계, 기획 검토: `planner`
- 실제 구현과 수정: `developer`
- 독립 코드 리뷰: `code-reviewer`
- 단일 파일의 작은 수정은 직접 처리하고 에이전트를 추가로 띄우지 않는다.

## 문서 흐름

1. 여러 PRD가 갈라지는 아이디어는 `planning-write`로 방향과 MVP 경계를 정한다. 단일 기능이면 생략한다.
2. `prd-write`로 기능 범위와 완료 조건을 정한다.
3. `spec-write`로 상태·분기·실패 동작을 확정한다.
4. `tech-write`로 실제 코드 기반 구현 방법을 정한다.
5. 구현 전 문서 검토가 필요하면 `plan-review`를 사용한다.
6. `dev-build`로 구현하고 `dev-review`로 검토한다.
7. 공유가 필요하면 `doc-html`로 HTML을 만든다.

상위기획은 `docs/planning/`, 기능 문서는 `docs/features/<기능-slug>/`에 둔다. 제품 결과를 바꾸는 미결정은 추측하지 않고 질문으로 남긴다. 훅은 사용하지 않으며 검사는 프로젝트의 기존 명령과 `node tools/docs.js`로 실행한다.

## MINIU 프론트 디자인 시스템

Codex와 Claude는 MINIU 프론트엔드 화면, 컴포넌트, 스타일을 만들거나 수정할 때 반드시 저장소의 디자인 시스템을 기준으로 작업한다. 디자인 시스템은 고정물이 아니며, 새 화면에 필요한 토큰, 컴포넌트 variant, 화면 규칙은 먼저 디자인 시스템에 반영한 뒤 사용한다. 임의의 새 스타일 체계, UI 라이브러리, CSS-in-JS, 별도 전역 CSS 체계를 추가하지 않는다.

- 스타일링은 Tailwind CSS v4를 기본으로 한다. `app/globals.css`의 `@import "tailwindcss"`, `@theme`, CSS variables를 디자인 토큰의 기준으로 사용한다.
- 공통 UI는 `shared/ui/*` 컴포넌트를 우선 사용하고, 필요한 확장은 기존 컴포넌트 variant나 prop으로 추가한다. 새 공통 컴포넌트가 필요하면 `shared/ui`에 추가하고 디자인 토큰을 사용한다.
- 제품/화면 규칙은 `shared/config/design-system.ts`를 기준으로 한다. 탭, 뷰포트, spacing, asset path, mock-only 규칙을 여기와 충돌하게 만들지 않는다.
- FSD 구조를 유지한다. 공통 UI는 `shared/ui`, 제품 설정은 `shared/config`, 도메인 표현은 `entities`, 화면 조합은 `widgets`, 진입점은 `app`에 둔다.
- 색상, 간격, radius, shadow, 폰트, 모바일 shell 폭은 기존 토큰을 우선 사용한다. 새 값이 필요하면 `app/globals.css` 또는 `shared/config/design-system.ts`에 의도를 드러내고 등록한 뒤 사용한다.
- 기능 API 연결 전까지 프론트 프리뷰는 mock 데이터만 사용한다. 임시 화면에서 `fetch`, Supabase, localStorage, sessionStorage를 새로 연결하지 않는다.
- Figma 에셋이 확정되기 전에는 `public/fonts`, `public/icons`, `public/minimi`의 README 규칙을 따르고, 코드-native placeholder는 교체 가능한 형태로 둔다.
- 기존 `app/page.tsx`, `app/layout.tsx`, `app/globals.css`의 MINIU 문구와 디자인 시스템 구조를 이전 컨셉으로 되돌리지 않는다.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
