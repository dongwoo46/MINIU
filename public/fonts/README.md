# Fonts

한글 글리프와 웹 사용 라이선스가 확인된 woff2 파일을 이곳에 넣고 app/globals.css의 @font-face 및 --font-ui / --font-body를 교체한다. 현재는 시스템 폰트만 사용하며 외부 폰트를 요청하지 않는다.

## silkscreen/

Google Fonts "Silkscreen" (SIL Open Font License 1.1, 상업적 사용 가능) — fonts.gstatic.com에서 latin 서브셋 woff2만 받아 자체 호스팅. `app/globals.css`의 `@font-face`로 등록되어 `--font-pixel-en` 토큰(Label/S En 등 영문 픽셀 폰트)이 사용한다. 한글 글리프는 없으므로 한글에는 사용하지 않는다.
