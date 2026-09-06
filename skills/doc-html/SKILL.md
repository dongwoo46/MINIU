---
name: doc-html
description: PRD, 기능명세, 기술설계 등 Markdown 문서를 읽기 쉬운 정적 HTML로 내보낸다. 공유용 문서 화면이 필요할 때 사용한다.
---

# Markdown HTML 출력

1. 원본 Markdown을 수정하지 않는다.
2. `node tools/docs.js html <파일.md ...>`를 실행한다.
3. 출력 위치는 기본 `dist/docs/`이며 `--out <경로>`로 바꿀 수 있다.
4. 생성된 HTML에 제목, 문서 상태, 반응형 표, 코드 블록, 인쇄 스타일이 포함됐는지 확인한다.
5. 완료 보고에 원본과 출력 파일을 함께 적는다.

외부 CDN, 브라우저 자동화, PDF, 첨부 버킷은 사용하지 않는다.
