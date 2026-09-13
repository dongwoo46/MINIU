# Fonts

한글 글리프와 웹 사용 라이선스가 확인된 woff2 파일을 이곳에 넣고 app/globals.css의 @font-face 및 --font-ui / --font-body를 교체한다. 현재는 시스템 폰트만 사용하며 외부 폰트를 요청하지 않는다.

## silkscreen/

Google Fonts "Silkscreen" (SIL Open Font License 1.1, 상업적 사용 가능) — fonts.gstatic.com에서 latin 서브셋 woff2만 받아 자체 호스팅. `app/globals.css`의 `@font-face`로 등록되어 `--font-pixel-en` 토큰(Label/S En 등 영문 픽셀 폰트)이 사용한다. 한글 글리프는 없으므로 한글에는 사용하지 않는다.

## dunggeunmo/

한글 픽셀 폰트 "DungGeunMo" — https://cactus.tistory.com/193 에서 WebFont(woff2) 배포본을 받아 자체 호스팅. `app/globals.css`의 `@font-face`로 등록되어 `--font-pixel` / `--font-pixel-kr` 토큰(한글 픽셀 폰트 전반)이 사용한다.

라이선스 참고: 위 배포 글 본문에는 "원본과 동일한 퍼블릭 도메인으로 재배포, 수정, 영리 목적 사용 등 걱정 없이 자유롭게 쓰면 됩니다"라고 적혀 있으나, 같은 글 하단의 티스토리 기본 CCL 배지는 "저작자표시 비영리 변경금지"로 표시되어 있어 문구가 서로 어긋난다. 후자는 해당 블로그의 모든 글에 기본으로 붙는 배지로 보이지만, 실제 상업 서비스에 사용하기 전에 원저작자의 명확한 라이선스(가능하면 OFL 등 명시적 문서)를 다시 한번 확인하는 것을 권장한다.
