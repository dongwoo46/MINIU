# MINIU(미니유) 백엔드 작업 상태

## 목적

- 백엔드에서 지금까지 한 일과 다음에 할 일을 기록한다.
- 다음 백엔드 작업은 이 문서의 `다음 작업` 순서대로 진행한다.
- AI 채팅(RAG Agent, LangChain, LangGraph, 말투, quota)은 나머지 백엔드 기능 완료 후 별도 작업으로 진행한다.

## 기준

- DB schema는 `supabase/migrations/001_miniu_schema.sql`을 기준으로 사용한다.
- schema가 부족하면 새 migration으로 필요한 컬럼, 테이블, 인덱스만 추가한다.
- 백엔드 기능명세는 `docs/features/miniu/backend-spec.md`를 기준으로 한다.
- 사용자에게 보이는 에러 메시지는 간단한 한글 문장으로 적는다.
- API 문서는 `npm run openapi:gen`으로 `docs/features/miniu/openapi.json`을 생성한다.

## 현재 완료 범위

### 계정·세션

- Supabase Auth 기반 회원가입, 이메일 인증, 로그인, 로그아웃을 연결했다.
- `miniu_session` httpOnly 쿠키와 `app_sessions` 기반 세션 흐름을 구성했다.
- 회원가입 중 `profiles`, `user_consents` 저장 실패 시 생성된 Auth 유저를 롤백한다.
- 계정 삭제 API를 추가하고, 프로필 30일 삭제 유예와 현재·전체 세션 폐기를 처리한다.
- 삭제 유예 중 재로그인하면 프로필 삭제 유예를 취소한다.

### 온보딩·커플

- `/api/miniu/me`에서 사용자, 커플, 미니유, 사전 질문, 문자·알림 미읽음 수를 조회한다.
- 초대 코드 생성, pending 초대 만료, 초대 수락, 커플 연결을 Supabase 기준으로 처리한다.
- 커플 연결 해제 시 관계 데이터 soft delete와 30일 purge 대상을 기록한다.
- 사전 질문 저장 시 `pre_question_sets`, `pre_question_answers`, 초기 `profile_cards`를 생성한다.

### 미니유·기록·프로필 카드

- 미니유 생성, 조회, 수정을 Supabase 기준으로 처리한다.
- 기록 생성, 조회, 삭제와 기록 출처 프로필 카드 삭제를 처리한다.
- 프로필 카드 조회, 수정, 삭제, 병합 API를 처리한다.
- 프로필 카드 병합 후보 조회와 후보 거절 API를 추가했다.

### 문자·알림

- 문자 첨부 업로드, 발송, 목록 조회, 상세 조회, 답장, 읽음 처리, 공유 카드 데이터 API를 추가했다.
- 문자 수신 시 알림을 생성하고, 수신자 기준 프로필 카드 후보 생성을 연결했다.
- 알림 목록, 미읽음 수, 읽음 처리, 알림 설정 조회·수정 API를 추가했다.
- 커플 연결과 문자 수신 알림 생성 시 사용자 알림 설정을 반영한다.
- 애정표현 활동 저장·목록 API를 추가하고, 연인에게 `affection_received` 알림을 생성한다.
- 같은 유형 애정표현이 5분 안에 반복되면 활동은 저장하되 알림은 묶어서 중복 생성하지 않는다.

### 집·인벤토리

- 집 방문·홈 요약 API를 추가해 내 미니유, 연인 미니유, 착용 아이템, 잠금 상태를 반환한다.
- 집 방문 시 `house_visited` 이벤트를 기록한다.
- 아이템 제안 조회, 승인, 거절 API를 추가했다.
- 인벤토리 조회와 아이템 착용 변경 API를 추가했다.
- 아이템 제안은 프로필 카드 10개 이상일 때 구체적 키워드가 2회 이상 언급되면 생성한다.

### 공유 이미지 데이터

- 공유 이미지 생성에 필요한 미니유, 배경, 착용 아이템, D-day, 개인정보 포함 여부 데이터를 반환한다.
- 대표 문구 후보 생성 API를 추가했다.
- 실제 이미지 파일 생성은 제외하고, 프론트 렌더링용 데이터만 제공한다.

### 문서·도구

- `docs/features/miniu/backend-spec.md`를 작성했다.
- `docs/features/miniu/openapi.md`와 자동 생성 결과 `docs/features/miniu/openapi.json`을 추가했다.
- `tools/openapi.js`와 `npm run openapi:gen`을 추가했다.
- `AGENTS.md`에 사용자 노출 에러 메시지는 간단한 한글로 적는 규칙을 추가했다.
- API 응답으로 브라우저에 전달되는 에러 메시지를 간단한 한글 문장으로 정리했다.

## 검증 상태

- `npm run typecheck` 통과.
- `npm run lint` 통과.
- `npm run test` 통과.
- `node tools/docs.js check` 통과.
- `npm run openapi:gen` 통과.

## 다음 작업

현재 AI 채팅을 제외한 백엔드 MVP API는 1차 구현 완료 상태다.

## 보류

- AI 채팅 RAG/Memory Agent.
- LangChain, LangGraph 도입.
- 사용자별 fine-tuning은 하지 않고 공통 LLM + 사용자별 DB 검색으로 개인화한다.
- 말투 프로필 캡처 분석.
- AI 채팅 최종 quota 정책.
- 대표 문구 AI 생성.
- 공유 이미지 파일 생성.

## schema 추가 후보

- 알림 묶음 처리를 위한 그룹 키.
- 문자 카드 이미지 생성 결과 캐시.

## 운영 규칙

- 작업이 끝난 항목은 `다음 작업`에서 지우고 `현재 완료 범위`에 옮긴다.
- 새로 막힌 결정은 `미결정` 섹션을 만들어 질문으로 남긴다.
- 큰 설계 변경이 생기면 `prd.md`, `spec.md`, `backend-spec.md`, `tech.md` 중 영향을 받는 문서도 같이 갱신한다.
