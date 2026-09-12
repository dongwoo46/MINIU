---
type: tech
feature: miniu
title: MINIU(미니유) 웹 MVP
status: draft
depends_on: [spec]
updated: 2026-09-11
---

# MINIU(미니유) 웹 MVP 기술설계

## 1. 타당성과 범위

- 판정: 조건부
- 근거: Next.js App Router 기반 API와 모바일 프리뷰 UI가 있고, Supabase 마이그레이션에 MVP 도메인 테이블·RLS가 준비되어 있다. 현재 인증, 현재 사용자 조회, 초대·커플 연결, 사전 질문, 미니유, 기록, 프로필 카드, 채팅 quota·로그는 Supabase 기준으로 동작한다. 남은 큰 범위는 프론트 실제 API 연결, 채팅 에이전트 고도화, 서브 기능 확장이다.
- 포함: R-1~R-27의 필수·메인 기능을 우선 설계한다. 인증, 세션, 온보딩, 커플 연결, 사전 질문, 미니유 생성, 기록, 프로필 카드, AI 채팅, 공통 에러·로깅을 다룬다.
- 제외: 문자, 집 방문, 애정표현, 아이템, 공유 이미지, 알림의 상세 구현은 서브 기능 착수 시 별도 설계로 확장한다. 현재 문서에서는 스키마와 API 경계만 유지한다.

## 2. 기존 코드 재사용

| 대상 | 위치 | 사용 방식 |
|---|---|---|
| Next Route Handlers | `app/api/miniu/**/route.ts` | BFF API 경계로 유지한다. 프론트는 Supabase를 직접 쓰지 않고 `/api/miniu/*`만 호출한다 |
| API 응답 래퍼 | `app/lib/miniu/http.ts` | 모든 라우트가 `{ ok, data/error }` 형태로 응답한다 |
| 인증·세션 helper | `app/lib/miniu/auth.ts` | `miniu_session` httpOnly 쿠키와 `app_sessions` 조회를 인증 단일 경로로 쓴다 |
| Supabase REST helper | `app/lib/miniu/supabase.ts` | service role 기반 서버 전용 DB 접근과 Supabase Auth REST 호출에 사용한다 |
| Supabase Auth helper | `app/lib/miniu/supabase-auth.ts` | 가입, 비밀번호 로그인, 이메일 인증 토큰 검증을 담당한다 |
| 입력 검증 | `app/lib/miniu/validation.ts` | 이메일·비밀번호·날짜·본문 검증과 표준 `ApiError`를 재사용한다 |
| 사실 분리·분류 프로토타입 | `app/lib/miniu/facts.ts` | 초기 MVP에서는 규칙 기반 카드 생성으로 쓰고, Gemini 분류기로 교체 가능한 경계로 둔다 |
| AI 호출 | `app/lib/miniu/gemini.ts` | 채팅 응답과 이후 분류·병합·대표 문구 생성에서 서버 전용 호출로 사용한다 |
| AI 채팅 에이전트(예정) | `app/lib/miniu/chat-agent.ts`, `app/lib/miniu/ai-context.ts` | 사용자 질문에 답할 때 프로필 카드·기록·문자·이전 채팅을 검색해 근거 기반으로 응답한다. LangGraph/LangChain 도입을 우선 검토하되, MVP 초기에는 같은 경계의 경량 구현으로 시작할 수 있다 |
| Supabase 스키마 | `supabase/migrations/001_miniu_schema.sql` | 실제 영속 저장소 기준. 테이블·RLS·RPC를 구현 기준으로 삼는다 |
| 프론트 기본틀 | `app/page.tsx`, `widgets/**`, `shared/ui/**` | 현재는 프리뷰 전용이다. 실제 기능 연결 시 mock 상태를 API client 상태로 교체한다 |

## 3. 구조

| 구성요소 | 책임 | 신규·기존 | 위치 |
|---|---|---|---|
| 인증 API | 회원가입, 이메일 인증, 재발송, 로그인, 로그아웃 | 기존 수정 | `app/api/miniu/auth/*/route.ts` |
| 사용자 API | 현재 사용자·온보딩·커플·미니유 요약 조회 | 기존 수정 필요 | `app/api/miniu/me/route.ts` |
| 초대 API | 초대 발급·조회, 코드 수락 | 기존 Supabase 전환 완료 | `app/api/miniu/invitations/**/route.ts` |
| 온보딩 API | 사전 질문 저장·조회, 초기 카드 생성, 온보딩 단계 갱신 | 기존 Supabase 전환 완료 | `app/api/miniu/onboarding/pre-questions/route.ts` |
| 미니유 API | 미니유 생성·조회·수정 | 기존 Supabase 전환 완료 | `app/api/miniu/miniu/route.ts` |
| 기록 API | 기록 CRUD, 분석 상태, 카드 생성 트리거 | 기존 Supabase 전환 완료 | `app/api/miniu/records/**/route.ts` |
| 프로필 카드 API | 카드 조회·수정·삭제·병합 | 기존 Supabase 전환 완료 | `app/api/miniu/profile-cards/**/route.ts` |
| 채팅 API | 일일 quota, 프롬프트 구성, Gemini 응답, 사용량 차감 | 기존 Supabase 전환 완료 | `app/api/miniu/chat/**/route.ts` |
| AI 채팅 에이전트 | 사용자 질문 의도 파악, 근거 검색, 충돌·불확실성 판단, 최종 응답 생성 | 신규 필요 | `app/lib/miniu/chat-agent.ts`, `app/lib/miniu/ai-context.ts` |
| 데이터 접근 계층 | Supabase REST/RPC 호출, 응답 매핑 | 신규 필요 | `app/lib/miniu/*.ts` |
| 도메인 매퍼 | DB snake_case와 앱 camelCase 타입 변환 | 신규 필요 | `app/lib/miniu/mappers.ts` 또는 기능별 helper |

- 선택 근거: App Router Route Handler를 BFF로 두면 service role key와 Gemini key가 브라우저에 노출되지 않고, httpOnly 쿠키 기반 세션도 현재 코드와 맞는다.
- 기각한 대안: 프론트에서 Supabase JS client를 직접 쓰는 방식은 RLS 활용은 쉽지만 현재 API 중심 코드와 충돌하고 service role이 필요한 프로필 생성·세션 revoke·이벤트 기록을 분산시킨다.

## 4. 데이터

| 값 | 타입·제약 | 저장 위치 | 변경 주체 | 명세 근거 |
|---|---|---|---|---|
| 계정 인증 | Supabase Auth email/password | `auth.users` | Supabase Auth, 인증 API | R-1, R-2 |
| 프로필 | `id`, `email`, `name`, `birth_date`, `email_verified_at`, `onboarding_step`, `deleted_at` | `profiles` | 인증·온보딩 API | R-1~R-3 |
| 이메일 인증 | Supabase Auth 이메일 링크·토큰 | `auth.users` | Supabase Auth, 인증 API | R-1 |
| 앱 세션 | random token hash, 30일 TTL, `revoked_at` | `app_sessions`, `miniu_session` 쿠키 | 로그인·인증·로그아웃 API | R-2 |
| 약관 동의 | 동의 타입, 문서 버전, 동의 시각 | `user_consents` | 회원가입 API | R-1, R-14 |
| 초대 | 코드, 상태, 생성자, 수락자, 만료 시각 | `invitations` | 초대 API | R-5, R-9 |
| 커플 | 커플 row와 양방향 member row | `couples`, `couple_members` | 초대 수락·해제 API | R-9~R-11 |
| 사전 질문 | 세트, 사귄 날짜, 5개 카테고리 답변 | `pre_question_sets`, `pre_question_answers` | 온보딩 API | R-6 |
| 미니유 | 이름, 프리셋, 외형 5속성, 삭제 시각 | `minius` | 미니유 API | R-8, R-30 |
| 기록 | 본문 150자 이하, 날짜, 분석 상태 | `records` | 기록 API, 분석 파이프라인 | R-15~R-19 |
| 프로필 카드 | 카테고리 5종, 내용, 출처, 사용자 수정 여부 | `profile_cards`, `profile_card_sources` | 분석 파이프라인, 카드 API | R-17~R-23 |
| 병합 후보 | source/target card, 상태 | `profile_merge_candidates` | 분석 파이프라인, 카드 API | R-18 |
| 채팅 | 메시지, 일일 사용량, KST 날짜 | `chat_messages`, `chat_daily_usage` | 채팅 API | R-24~R-27 |
| 이벤트 | event_name, user_id, couple_id, metadata | `event_logs` | 각 API | R-13 |

## 5. 인터페이스

| 호출 | 입력 | 출력 | 오류 | 권한 |
|---|---|---|---|---|
| `POST /api/miniu/auth/signup` | `name`, `birthDate`, `email`, `password`, 필수 동의 6종, `marketing` | public user, `devVerificationCode` | 400 validation, 409 conflict | 공개 |
| `POST /api/miniu/auth/verify` | `email`, `code` | public user, 세션 쿠키 | 401 invalid, 409 already verified | 공개 |
| `POST /api/miniu/auth/resend-verification` | `email` | `devVerificationCode` | 404 not found, 409 already verified | 공개 |
| `POST /api/miniu/auth/login` | `email`, `password` | public user, 세션 쿠키 | 401 invalid, 403 unverified | 공개 |
| `POST /api/miniu/auth/logout` | 없음 | `loggedOut` | 표준 오류 | 로그인 선택 |
| `GET /api/miniu/me` | 없음 | user, couple, miniu, onboarding | 401, 403 | 로그인 |
| `GET /api/miniu/invitations` | 없음 | 최신 pending invitation | 401, 403 | 로그인 |
| `POST /api/miniu/invitations` | 없음 | invitation, code, link | 409 already connected | 로그인 |
| `POST /api/miniu/invitations/accept` | `code` | couple | 400 invalid, 403 own code, 409 already connected/expired | 로그인 |
| `GET/POST /api/miniu/onboarding/pre-questions` | 사귄 날짜, 카테고리별 답변 배열 | preQuestions, card count | 400 validation | 로그인 |
| `GET/POST/PATCH /api/miniu/miniu` | 이름, 프리셋, 외형 옵션 | miniu | 403 no couple, 409 duplicate | 로그인+커플 |
| `GET/POST /api/miniu/records` | content, happenedOn | records, created record | 400 validation, 403 no couple | 로그인+커플 |
| `DELETE /api/miniu/records/[id]` | record id | deleted | 404 | 로그인+커플 |
| `GET /api/miniu/profile-cards` | 없음 | cards | 403 no couple | 로그인+커플 |
| `PATCH/DELETE /api/miniu/profile-cards/[id]` | content, category | card or deleted | 400, 404 | 로그인+커플 |
| `POST /api/miniu/profile-cards/[id]/merge` | targetCardId | merged card | 400, 404 | 로그인+커플 |
| `POST /api/miniu/chat` | message | reply, usage | 403 no couple, 429 quota | 로그인+커플 |
| `GET /api/miniu/chat/quota` | 없음 | limit, used, remaining, resetsAt | 403 no couple | 로그인+커플 |

## 6. 처리와 복구

- 정상 흐름:
  1. 회원가입 API가 Supabase Auth 유저와 `profiles` row, 동의 이력을 만들고 Supabase Auth 인증 메일을 발송한다.
  2. 인증 콜백/API가 Supabase Auth 토큰을 확인하고 `profiles.email_verified_at`, `onboarding_step`을 갱신한 뒤 `app_sessions` 토큰을 발급한다.
  3. 모든 보호 API는 `requireUser()`로 `miniu_session` 쿠키를 읽고 `app_sessions`의 hash, 만료, revoke 상태를 검증한다.
  4. 온보딩은 초대 발급·수락, 사전 질문 저장, 홈 진입 상태를 `profiles.onboarding_step`으로 전이한다.
  5. 커플 연결 이후 미니유, 기록, 카드, 채팅 API가 열린다.
  6. AI 채팅은 단순 LLM 호출이 아니라 질문에 맞춰 `profile_cards`, `records`, `letters`, `chat_messages`를 검색하고 근거를 종합해 답하는 RAG/Agent 구조로 설계한다. 예: "내 남친이 목걸이 좋아할까?" → 취향 카드, 선물·액세서리 관련 기록, 연인이 보낸 문자, 이전 채팅 맥락을 조회한 뒤 가능성·근거·불확실성을 함께 답한다.
- 실패 흐름:
  - Supabase Auth 비밀번호 검증 실패는 API에서 `401 UNAUTHORIZED`로 통일한다.
  - 이메일 미인증은 `403 FORBIDDEN`으로 응답하고 프론트는 인증 안내로 보낸다.
  - 세션 만료·revoke·프로필 삭제는 `401 UNAUTHORIZED`로 응답한다.
  - 커플 미연결에서 잠긴 기능을 호출하면 `403 FORBIDDEN`으로 응답한다.
  - AI 분류·채팅 실패는 원본 저장을 되돌리지 않고 분석 상태 또는 응답 오류만 기록한다.
- 재시도·중복 방지:
  - 회원가입 전 `profiles.email` 중복을 확인한다. Auth 유저 생성 후 프로필·동의 저장 실패 시 Auth 유저를 롤백하고 로그를 남긴다.
  - 이메일 인증은 Supabase Auth 토큰 검증 결과만 수락한다.
  - 새 초대 발급 전 같은 사용자의 pending 초대를 만료한다.
  - 채팅 사용량은 응답 생성 성공 후에만 증가한다.
- 되돌리기:
  - 로그아웃은 `app_sessions.revoked_at` 갱신과 쿠키 삭제로 처리한다.
  - 커플 해제와 계정 삭제는 `deleted_at`, `purge_after`를 먼저 채우고 30일 후 완전 삭제 배치로 처리한다.

## 7. 구현 순서

1. 인증 Supabase 통일
   - 완료 조건: 가입·인증·로그인·로그아웃이 `auth.users`, `profiles`, `email_verification_codes`, `app_sessions`만 사용한다.
   - 확인 명령: `npm run typecheck`, `npm run lint`
2. 현재 사용자 조회 Supabase 전환
   - 완료 조건: `/api/miniu/me`가 Supabase에서 프로필, 커플, 미니유, 사전 질문 여부를 조회한다.
   - 확인 명령: `npm run typecheck`, `npm run lint`
3. 초대·커플 연결 Supabase 전환
   - 완료 조건: 초대 발급·수락은 서버 라우트가 `miniu_session`으로 인증한 사용자 기준으로 `invitations`, `couples`, `couple_members`를 갱신하고 온보딩 단계가 갱신된다.
   - 확인 명령: `npm run typecheck`, `npm run lint`
4. 사전 질문·미니유 Supabase 전환
   - 완료 조건: 사전 질문 저장 시 `pre_question_sets`, `pre_question_answers`, 초기 `profile_cards`가 생성되고 미니유는 커플 연결 후에만 생성된다.
   - 확인 명령: `npm run typecheck`, `npm run lint`
5. 기록·프로필 카드 Supabase 전환
   - 완료 조건: 기록 CRUD, 카드 생성·수정·삭제·병합이 Supabase 테이블과 RLS 기준으로 동작한다.
   - 확인 명령: `npm run typecheck`, `npm run lint`
6. AI 채팅 Supabase 전환
   - 완료 조건: 카드·기록·문자·이전 채팅 기반 검색 컨텍스트, KST 일일 quota, 성공 후 차감, 실패 시 미차감이 Supabase 기준으로 동작한다. LangGraph/LangChain 기반 에이전트 도입은 이 단계에서 별도 세부 설계한다.
   - 확인 명령: `npm run typecheck`, `npm run lint`
7. 프론트 실제 API 연결
   - 완료 조건: 프리뷰 mock을 가입·로그인·온보딩·홈·기록·프로필·채팅 API 호출 상태로 교체한다.
   - 확인 명령: `npm run typecheck`, `npm run lint`
8. 문서 추적 검증
   - 완료 조건: PRD, spec, tech 연결이 깨지지 않는다.
   - 확인 명령: `node tools/docs.js check docs/features/miniu/tech.md`, `node tools/docs.js trace miniu`

## 8. 미결정

| 질문 | 결정이 필요한 이유 | 막히는 작업 |
|---|---|---|
| 실제 이메일 발송은 Supabase 메일을 쓸지, 현재 개발용 코드 응답을 유지할지 | 현재 API는 `devVerificationCode`를 반환한다. 배포 전 사용자 이메일 인증 UX와 발송 주체를 정해야 한다 | R-1, R-5 |
| AI 분류·병합을 Gemini로 즉시 전환할지 규칙 기반 MVP 후 교체할지 | 현재 `facts.ts`는 규칙 기반이며 R-17/R-18의 AI 판정과 차이가 있다 | R-17, R-18 |
| AI 채팅 에이전트를 LangGraph/LangChain으로 어느 깊이까지 구현할지 | 사용자가 질문하면 DB·문자·채팅 기록을 찾아 가장 근거 있는 답을 내야 하므로 단순 프롬프트보다 깊은 설계가 필요하다 | R-24, R-25 |
| 커플 연결 해제 30일 유예 중 재연결로 삭제 취소를 허용할지 | 삭제·복구 UX와 배치 정책이 달라진다 | R-11 |
| 민감 데이터 저장 구간 암호화 수준과 보관 기간 | 법적 검토가 필요한 정책이다 | R-14 |
