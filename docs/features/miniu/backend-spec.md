---
type: spec
feature: miniu
title: MINIU(미니유) 백엔드 기능명세
status: draft
depends_on: [prd, spec]
updated: 2026-09-12
---

# MINIU(미니유) 백엔드 기능명세

## 1. 기준과 범위

- 기준 문서: `docs/features/miniu/prd.md`, `docs/features/miniu/spec.md`.
- 목표: 프론트 구현 전에 백엔드에서 개발해야 할 기능을 API, 권한, 실패 처리 기준으로 정리한다.
- 포함: 계정, 세션, 온보딩, 커플 연결, 미니유, 기록, 프로필 카드, 커플 해제, 문자, 집 방문, 애정표현, 아이템, 공유 이미지 데이터, 알림.
- 제외: AI 채팅 응답 생성, 채팅 에이전트, LangChain/LangGraph, 채팅 말투 적용, 채팅 quota. 즉 R-24~R-27은 나머지 백엔드 작업이 끝난 뒤 별도로 진행한다.
- 원칙: 브라우저는 Supabase를 직접 호출하지 않고 `/api/miniu/*` BFF만 호출한다. 서버는 Supabase Auth, Supabase REST, service role을 사용한다.
- DB 원칙: 기본 DB schema는 이미 작성된 `supabase/migrations/001_miniu_schema.sql`을 기준으로 삼고, 구현 중 부족한 컬럼·테이블·인덱스만 새 migration으로 추가한다.
- 에러: 사용자에게 보이는 에러 메시지는 간단한 한글 문장으로 응답한다.

## 2. 기능 상세

### R-1 일반 회원가입

- API: `POST /api/miniu/auth/signup`.
- 입력: `name`, `birthDate`, `email`, `password`, 필수 동의 6종, 선택 마케팅 동의.
- 동작: 입력 검증, 만 14세 이상 검증, 이메일 중복 확인, Supabase Auth 사용자 생성, `profiles` 생성, `user_consents` 생성, 인증 메일 발송.
- 완료 조건: 중복 이메일은 차단한다. 프로필·동의 저장 실패 시 생성된 Auth 사용자를 롤백한다.

### R-2 로그인·로그아웃·세션

- API: `POST /api/miniu/auth/login`, `POST /api/miniu/auth/logout`, `POST /api/miniu/auth/delete`.
- 동작: 이메일·비밀번호 검증, 이메일 인증 여부 확인, `app_sessions` 생성·폐기, `miniu_session` httpOnly 쿠키 설정·삭제.
- 완료 조건: 세션 만료·폐기 사용자는 보호 API에 접근할 수 없다. 계정 삭제는 30일 유예 상태를 만들고, 유예 중 재로그인하면 삭제 유예를 취소한다.

### R-3 상태 기반 라우팅 가드

- API: `GET /api/miniu/me`.
- 출력: `user`, `couple`, `miniu`, `onboarding`.
- 동작: 로그인, 이메일 인증, 온보딩 단계, 커플 연결, 미니유 생성 여부를 서버에서 계산한다.
- 완료 조건: 프론트는 이 응답만으로 다음 화면을 결정할 수 있다.

### R-4 웹 셸과 하단 탭

- 백엔드 책임: 탭별 잠금 여부와 배지 데이터를 제공한다.
- 필요 API: `GET /api/miniu/me`, `GET /api/miniu/notifications`, 문자 미읽음 카운트 포함 API.
- 완료 조건: 커플 미연결 사용자가 기록·프로필·문자·집 기능 API를 호출하면 `403`을 반환한다.

### R-5 커플 연결 링크·코드 생성

- API: `GET /api/miniu/invitations`, `POST /api/miniu/invitations`, `PATCH /api/miniu/invitations`.
- 동작: 최신 pending 초대 조회, 기존 pending 초대 만료, 새 코드·링크 발급, 연결 없이 사전 질문 단계로 이동.
- 완료 조건: 코드는 만료 시간을 가진다. 연결된 사용자는 새 초대를 만들 수 없다.

### R-6 사전 질문

- API: `GET /api/miniu/onboarding/pre-questions`, `POST /api/miniu/onboarding/pre-questions`.
- 입력: `relationshipStartedOn`, `likes`, `dislikes`, `tendencies`, `habits`, `values`.
- 동작: 기존 사전 질문 soft delete, 새 질문 세트·답변 저장, 초기 `profile_cards`와 `profile_card_sources` 생성, 온보딩 단계 `home` 갱신.
- 완료 조건: 다섯 카테고리 중 하나라도 비면 저장하지 않는다.

### R-7 홈 첫 진입

- API: `GET /api/miniu/me`.
- 동작: 홈 진입에 필요한 커플 연결 여부, 미니유 존재 여부, 사전 질문 완료 여부를 제공한다.
- 완료 조건: 미연결이면 홈 조회는 가능하지만 잠긴 기능 API는 차단된다.

### R-8 미니유 생성

- API: `GET /api/miniu/miniu`, `POST /api/miniu/miniu`, `PATCH /api/miniu/miniu`.
- 입력: `name`, `preset`, `hairStyle`, `hairColor`, `skinTone`, `faceShape`, `expression`.
- 동작: 커플 연결 확인 후 미니유 생성·조회·수정.
- 완료 조건: 사용자당 활성 미니유는 1개만 허용한다. 미연결 사용자는 생성·수정할 수 없다.

### R-9 커플 연결 수락

- API: `POST /api/miniu/invitations/accept`.
- 입력: `code`.
- 동작: 코드 정규화, 본인 코드 차단, 만료·사용됨 차단, 양쪽 연결 여부 확인, `couples`와 양방향 `couple_members` 생성, 초대 accepted 처리, 알림·이벤트 생성.
- 완료 조건: 한 계정은 동시에 한 명과만 연결된다.

### R-10 연결 전 이용 범위

- 백엔드 책임: 연결 후 기능 API에서 커플 연결을 필수로 검증한다.
- 적용 API: 미니유 생성·수정, 기록, 프로필 카드, 문자, 집 방문, 애정표현, 아이템, 공유 이미지 데이터.
- 완료 조건: 미연결 호출은 저장 없이 `403`을 반환한다.

### R-11 커플 연결 해제

- API: `POST /api/miniu/couple/unlink`.
- 입력: `confirmed`.
- 동작: 확인값 검증, 커플 상태를 해제 유예로 변경, 양쪽 관계 데이터 soft delete, pending 초대 만료, 양쪽 온보딩 단계 재시작.
- 삭제 대상: 문자, 기록, 프로필 카드, 말투 프로필, 아이템 제안, 미니유, 사전 질문 원본 응답.
- 완료 조건: 30일 유예 시각을 저장하고, 해제 전 확인 없이 실행하지 않는다.

### R-12 로딩·빈·실패 상태

- 백엔드 책임: 빈 데이터는 성공 응답의 빈 배열·`null`로 반환하고, 실패는 표준 `{ ok: false, error }`로 반환한다.
- 완료 조건: 네트워크·서버 실패와 비어 있는 상태를 프론트가 구분할 수 있다.

### R-13 이벤트 로깅

- 저장소: `event_logs`.
- 대상 이벤트: 회원가입, 이메일 인증 완료, 로그인, 사전 질문 완료, 미니유 생성, 커플 연결, 커플 해제, 첫 기록 작성, 문자 발송, 집 방문, 애정표현, 아이템 승인, 공유 이미지 저장, 알림 확인.
- 완료 조건: 성공 지표 산출에 필요한 최소 이벤트가 남는다.

### R-14 민감 데이터 보호

- 동작: 기록·문자·첨부·대화 캡처는 서버 저장소만 신뢰한다. 삭제와 해제는 soft delete 후 purge 대상 시각을 남긴다.
- 완료 조건: 브라우저 storage를 신뢰 저장소로 쓰지 않는다. 대화 캡처 원본은 저장하지 않거나 분석 직후 삭제한다.

### R-15 기록 작성

- API: `GET /api/miniu/records`, `POST /api/miniu/records`.
- 입력: `content`, `happenedOn`.
- 동작: 150자 이하 검증, 기록 저장, 분석 상태 `pending` 설정, 분류 파이프라인 트리거.
- 완료 조건: 기록 저장은 AI 분석 완료를 기다리지 않는다.

### R-16 기록 조회·삭제

- API: `DELETE /api/miniu/records/[id]`.
- 동작: 본인 기록만 조회·삭제한다. 기록 삭제 시 해당 기록 출처의 프로필 카드를 함께 삭제한다.
- 완료 조건: 연인의 기록은 조회되지 않는다.

### R-17 사실 단위 분리와 자동 분류

- 트리거: 사전 질문 저장, 기록 저장, 문자 수신.
- 동작: 원문을 사실 단위로 분리하고 5개 카테고리로 분류해 카드 후보를 만든다.
- 완료 조건: 분류 불가 사실은 카드로 만들지 않고 원문은 유지한다.

### R-18 AI 병합과 미분류 보관

- API: `GET /api/miniu/profile-cards/merge-candidates`, `POST /api/miniu/profile-cards/merge-candidates/[id]/reject`, `POST /api/miniu/profile-cards/[id]/merge`.
- 동작: 의미가 같거나 포함 관계인 카드를 후보로 저장하고, 사용자 확인 후에만 출처를 합친다.
- 완료 조건: 자동 병합은 하지 않는다. 거절 시 새 카드로 유지한다.

### R-19 분석 실패 복구

- API: `POST /api/miniu/records/[id]/retry-analysis`.
- 동작: 일시 실패만 재시도 가능하게 하고, 재시도 전 기존 분석 출처를 정리한다.
- 완료 조건: 분석 실패가 기록·문자·사전 질문 저장을 막지 않는다.

### R-20 카드 조회

- API: `GET /api/miniu/profile-cards`.
- 동작: 본인 카드만 최신순·카테고리별로 조회하고 출처를 포함한다.
- 완료 조건: 연인이 만든 카드는 보이지 않는다.

### R-21 카드 수정·삭제

- API: `PATCH /api/miniu/profile-cards/[id]`, `DELETE /api/miniu/profile-cards/[id]`.
- 동작: 내용·카테고리 수정 시 `user_edited`를 true로 표시한다. 삭제는 카드만 soft delete한다.
- 완료 조건: 카드 수정·삭제는 출처 원문을 바꾸지 않는다.

### R-22 사용자 수정 보호·상반 정보

- 동작: `user_edited` 카드에는 자동 분석 결과를 덮어쓰지 않는다. 상반 정보는 최신 기록 기반 후보로 남긴다.
- 완료 조건: 사용자가 직접 고친 카드가 자동으로 바뀌지 않는다.

### R-23 변경 즉시 반영

- 백엔드 책임: 카드 조회·아이템 제안·대표 문구 생성은 항상 최신 활성 카드만 사용한다.
- 완료 조건: 삭제·수정된 카드는 후속 기능 컨텍스트에서 제외되거나 갱신된다.

### R-28 홈 화면 구성

- API: 홈 요약 API 또는 `GET /api/miniu/me` 확장.
- 출력: 미니유, 집 배경 키, 착용 아이템, 연결 상태, 잠금 상태.
- 완료 조건: 미니유가 없으면 null로 반환하고, 프론트가 물음표 상태를 표시할 수 있다.

### R-29 집 방문

- API: `GET /api/miniu/house`.
- 출력: 미니유, 인벤토리, 착용 아이템, 애정표현 가능 상태.
- 완료 조건: 커플 연결된 사용자만 조회할 수 있다.

### R-30 미니유 꾸미기

- API: `PATCH /api/miniu/miniu`.
- 동작: 커플 연결 중 이름·외형 속성을 수정한다.
- 완료 조건: 수정 결과는 홈·집·공유 이미지 데이터에 즉시 반영된다.

### R-31 애정표현

- API: `POST /api/miniu/affections`.
- 입력: `affectionType`.
- 동작: 커플 연결 확인, 애정표현 활동 저장, 이벤트 기록, 알림 생성 트리거.
- 완료 조건: 지원 타입은 껴안기, 뽀뽀하기, 쓰다듬기다.

### R-32 애정표현 알림

- API: `GET /api/miniu/notifications`, `PATCH /api/miniu/notifications/[id]/read`, 알림 설정 API.
- 동작: 연인에게 알림을 만들고, 같은 유형 5분 내 연타는 묶거나 제한한다.
- 완료 조건: 수신 끔이면 뱃지가 증가하지 않는다.

### R-33 문자 발송

- API: `POST /api/miniu/letters`, `POST /api/miniu/letters/attachments`.
- 입력: `content`, 선택 이미지 첨부, 텍스트형 이모지.
- 동작: 커플 연결 확인, 수신자 계산, 문자 저장, 첨부 저장, 수신자 알림 생성.
- 완료 조건: 빈 문자는 차단한다. 이미지 일부 실패 시 성공분은 유지하고 실패 개수를 응답한다.

### R-34 문자 조회·답장

- API: `GET /api/miniu/letters`, `GET /api/miniu/letters/[id]`, `PATCH /api/miniu/letters/[id]/read`, `POST /api/miniu/letters`.
- 동작: 발신·수신 문자를 최신순 조회한다. 상세 열람 시 수신자 기준으로 읽음 처리한다. 답장은 새 문자로 저장한다.
- 완료 조건: 읽음 여부는 상대에게 노출하지 않는다.

### R-35 문자 저장·공유

- API: `GET /api/miniu/letters/[id]/share-card`.
- 동작: 문자 카드 이미지 생성에 필요한 안전한 데이터만 반환하거나 서버에서 이미지 파일을 생성한다.
- 완료 조건: 권한 없는 사용자는 문자 데이터를 받을 수 없다.

### R-36 문자 기반 정보 활용

- 트리거: 문자 수신·저장 후.
- 동작: 문자 내용에서 5개 카테고리에 해당하는 사실만 프로필 카드 후보로 반영한다.
- 완료 조건: 문자 출처는 `letter`로 구분한다. 말투 프로필은 바꾸지 않는다.

### R-37 AI 아이템 제안

- API: `GET /api/miniu/item-suggestions`, `POST /api/miniu/item-suggestions/[id]/accept`, `POST /api/miniu/item-suggestions/[id]/reject`.
- 동작: 기록 10개 이상, 같은 구체적 취향·사물 2회 이상, 착용·휴대 가능 조건을 만족하면 제안 생성.
- 완료 조건: 사용자 승인 전에는 인벤토리에 생성하지 않는다.

### R-38 인벤토리

- API: `GET /api/miniu/inventory`, `PATCH /api/miniu/inventory/[id]`.
- 동작: 보유 아이템 조회, 착용·해제 변경.
- 완료 조건: 활성 아이템은 최대 10개다.

### R-39 공유 이미지 저장

- API: `GET /api/miniu/share-scene`.
- 출력: 미니유, 배경, 착용 아이템, D-day, 선택 대표 문구.
- 동작: 실제 이미지 파일 생성 전 프론트 렌더링에 필요한 데이터만 반환한다.
- 제외: 이미지 파일 생성은 이미지 에셋과 렌더링 방식 확정 후 별도 구현한다.
- 완료 조건: 실제 이름·문자 원문·기록 원문은 기본 응답에 포함하지 않는다.

### R-40 대표 문구

- API: `POST /api/miniu/share-phrases`.
- 동작: 활성 프로필 카드 기반 대표 문구 후보 3개 생성 또는 직접 입력 저장.
- 완료 조건: 카드가 없거나 생성 실패 시 직접 입력만으로 공유 이미지를 만들 수 있다.

### R-41 인앱 알림 센터

- API: `GET /api/miniu/notifications`, `PATCH /api/miniu/notifications/[id]/read`, `PATCH /api/miniu/notification-settings`.
- 동작: 커플 연결, 문자 수신, 애정표현 활동 알림을 목록과 미읽음 수로 제공한다.
- 완료 조건: 알림 확인 시 뱃지가 감소한다.

## 3. 상태

| 상태 | 저장 위치 | 백엔드 처리 |
|---|---|---|
| 미인증 계정 | `auth.users`, `profiles` | 로그인 차단, 인증 안내 |
| 인증 계정 | `profiles.email_verified_at` | 온보딩 단계에 따라 응답 |
| 삭제 유예 계정 | `profiles.deleted_at`, `purge_after` | 세션 폐기, 보호 API 차단 |
| 온보딩 단계 | `profiles.onboarding_step` | `email_verification` → `couple_link` → `pre_questions` → `home` |
| 초대 대기 | `invitations.status = pending` | 조회·수락 가능, 만료 시 expired |
| 커플 연결 | `couples`, `couple_members` | 연결 후 기능 허용 |
| 커플 해제 유예 | `couples.status`, `purge_after` | 관계 데이터 soft delete |
| 기록 분석 | `records.analysis_status` | `pending`, `complete`, `failed_temporary`, `failed_permanent` |
| 카드 병합 후보 | `profile_merge_candidates` | 사용자 확인 전 대기 |
| 알림 미읽음 | `notifications.read_at is null` | 배지 카운트 포함 |

## 4. 분기와 실패

| 경우 | 응답 |
|---|---|
| 입력값 누락·형식 오류 | `400 VALIDATION_ERROR`, 간단한 한글 메시지 |
| 미로그인·세션 만료 | `401 UNAUTHORIZED` |
| 이메일 미인증 | `403 FORBIDDEN` |
| 커플 미연결 | `403 FORBIDDEN`, "연인과 연결해 주세요." |
| 중복 가입·중복 미니유 | `409 CONFLICT` |
| 초대 코드 없음·만료·본인 코드 | 케이스별 `409 CONFLICT` |
| 권한 없는 리소스 조회 | `404 NOT_FOUND` 또는 빈 목록 |
| 이미지 일부 업로드 실패 | 성공분 저장, 실패 개수 반환 |
| 분석 일시 실패 | 원문 유지, 재시도 가능 상태 |
| 분석 영구 실패 | 원문 유지, 재시도 불가 상태 |

## 5. 데이터와 권한

- DB schema는 기존 migration을 우선 사용한다.
- 계정·세션: `auth.users`, `profiles`, `app_sessions`.
- 동의: `user_consents`.
- 커플: `invitations`, `couples`, `couple_members`.
- 온보딩: `pre_question_sets`, `pre_question_answers`.
- 미니유: `minius`.
- 기록·카드: `records`, `profile_cards`, `profile_card_sources`, `profile_merge_candidates`.
- 문자·첨부: `letters`, `letter_attachments`, Supabase Storage.
- 집·애정표현·아이템: `affection_activities`, `item_suggestions`, `inventory_items`.
- 알림: `notifications`, `notification_settings`.
- 이벤트: `event_logs`.
- 권한 원칙: 기록, 카드, 사전 질문, 미니유, 아이템은 본인 소유 데이터만 읽고 쓴다. 문자는 발신자와 수신자만 읽을 수 있다. 커플 연결은 기능 잠금 해제 조건이지 기록 공개 조건이 아니다.
- 현재 schema 검토상 백엔드 우선 구현에 즉시 필요한 큰 테이블은 대부분 준비되어 있다.
- 추가한 schema: `supabase/migrations/003_chat_messages_deletion.sql`에서 `chat_messages.deleted_at`, `chat_messages.purge_after`를 추가했다.
- 구현 중 추가 가능성이 있는 항목: 공유 이미지 저장 이력 테이블, 문자 카드 이미지 생성 결과 캐시, 알림 묶음 처리를 위한 그룹 키, 아이템 에셋 매핑 테이블.

## 6. 미결정

| 질문 | 막히는 작업 |
|---|---|
| 초대 코드 이메일 공유를 실제 메일로 보낼지 링크 복사로 시작할지 | R-5 |
| 커플 해제 30일 유예 중 재연결로 삭제 취소를 허용할지 | R-11 |
| 병합 후보 UX를 카드 상세, 알림, 별도 목록 중 어디에 둘지 | R-18 |
| 문자에서 이미지·이모지만 있는 발송을 허용할지 | R-33 |
| 수신 끈 알림을 목록에 쌓을지 완전히 만들지 않을지 | R-32, R-41 |
| 공유 이미지를 서버에서 생성할지 프론트 캔버스에서 생성할지 | R-35, R-39 |
| 아이템 에셋 키와 취향 키워드 매핑 테이블 | R-37, R-38 |
