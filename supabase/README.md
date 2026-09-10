# MINIU Supabase

## Local Site URL

로컬 실행 기준:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Supabase Auth Redirect URL에도 `http://localhost:3000/auth/callback`을 추가한다.

## Schema

초기 설계는 `supabase/migrations/001_miniu_schema.sql`에 있다.

- `auth.users`를 계정 원장으로 쓰고, 서비스 필드는 `profiles`에 둔다.
- 기록, 사전 질문, 프로필 카드, 말투, AI 채팅은 `user_id = auth.uid()` RLS로 본인에게만 열린다.
- 커플 연결은 `couples` + `couple_members`로 관리하고, 한 사용자는 활성 커플 1개만 가질 수 있다.
- 초대 코드는 원문 대신 `code_hash`를 저장한다.

## Reset Warning

원격 Supabase 스키마 비우기는 모든 데이터를 지우는 작업이다. 실제 실행 전에 Supabase 프로젝트가 개발용인지 확인하고, 필요하면 백업을 먼저 만든다.

스키마를 비운 뒤 다시 적용할 때의 순서:

1. `supabase/reset_public_schema.sql` 실행
2. `supabase/migrations/001_miniu_schema.sql` 실행
