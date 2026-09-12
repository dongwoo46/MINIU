# MINIU OpenAPI 사용법

- 생성 명령: `npm run openapi:gen`
- 생성 파일: `docs/features/miniu/openapi.json`
- 확인 방법: Swagger Editor 또는 Swagger UI에서 `openapi.json`을 불러온다.
- 생성 기준: `app/api/miniu/**/route.ts`의 `GET`, `POST`, `PATCH`, `DELETE` export를 스캔한다.
- 주의: 요청 바디 schema는 `tools/openapi.js`의 `requestBodyRefs`, `schemas`에 정의한다.
