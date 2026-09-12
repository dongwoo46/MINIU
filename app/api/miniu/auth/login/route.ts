import { createAppSession, getProfileById, publicUser, restoreProfileDeletion, setSessionCookie } from "@/app/lib/miniu/auth";
import { logSupabaseEvent } from "@/app/lib/miniu/events";
import { fail, ok } from "@/app/lib/miniu/http";
import { assertObject, normalizeEmail, stringField } from "@/app/lib/miniu/validation";
import { verifySupabasePassword } from "@/app/lib/miniu/supabase-auth";

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const email = normalizeEmail(stringField(body, "email"));
    const password = stringField(body, "password");

    const userId = await verifySupabasePassword(email, password);
    let user = await getProfileById(userId);
    if (!user && (await restoreProfileDeletion(userId))) {
      user = await getProfileById(userId);
    }

    if (!user) {
      return Response.json({ ok: false, error: { code: "UNAUTHORIZED", message: "이메일 또는 비밀번호가 올바르지 않아요.", details: null } }, { status: 401 });
    }
    if (!user.emailVerifiedAt) {
      return Response.json({ ok: false, error: { code: "FORBIDDEN", message: "이메일 인증이 필요해요.", details: null } }, { status: 403 });
    }
    if (!user.requiredConsentsAgreedAt) {
      return Response.json({ ok: false, error: { code: "FORBIDDEN", message: "필수 동의가 필요해요.", details: null } }, { status: 403 });
    }

    const sessionId = await createAppSession(user.id);
    await logSupabaseEvent({ userId: user.id, name: "login_completed" });
    await setSessionCookie(sessionId);
    return ok({ user: publicUser(user) });
  } catch (error) {
    return fail(error);
  }
}
