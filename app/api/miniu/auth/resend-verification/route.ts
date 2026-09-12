import { getProfileByEmail } from "@/app/lib/miniu/auth";
import { fail, ok } from "@/app/lib/miniu/http";
import { ApiError, assertObject, normalizeEmail, stringField } from "@/app/lib/miniu/validation";
import { requestSignupVerificationEmail } from "@/app/lib/miniu/supabase-auth";

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const email = normalizeEmail(stringField(body, "email"));

    const user = await getProfileByEmail(email);

    if (!user) {
      return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "계정을 찾을 수 없어요.", details: null } }, { status: 404 });
    }
    if (user.emailVerifiedAt) {
      return Response.json({ ok: false, error: { code: "CONFLICT", message: "이미 인증된 이메일이에요.", details: null } }, { status: 409 });
    }

    await requestSignupVerificationEmail(user.email);

    return ok({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return Response.json({ ok: false, error: { code: "BAD_REQUEST", message: "인증 메일을 보내지 못했어요.", details: null } }, { status: 400 });
    }
    return fail(error);
  }
}
