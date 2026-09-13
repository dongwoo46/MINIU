import { createAppSession, getProfileById, publicUser, restoreProfileDeletion, setSessionCookie } from "@/app/lib/miniu/auth";
import { logSupabaseEvent } from "@/app/lib/miniu/events";
import { fail, ok } from "@/app/lib/miniu/http";
import { patchRows } from "@/app/lib/miniu/supabase";
import { assertObject, normalizeEmail, stringField } from "@/app/lib/miniu/validation";
import { verifySupabasePassword } from "@/app/lib/miniu/supabase-auth";

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const email = normalizeEmail(stringField(body, "email"));
    const password = stringField(body, "password");

    // verifySupabasePassword already rejects with 403 if Supabase itself considers the
    // email unconfirmed, so reaching this point means Supabase has confirmed it. Our own
    // profiles.email_verified_at is a denormalized copy that the /auth/callback redirect
    // sometimes fails to update (e.g. Supabase's default confirmation email verifies
    // server-side before redirecting, so no token reaches our callback) — heal it here
    // instead of trusting it as a second gate, which previously blocked genuinely
    // verified users.
    const userId = await verifySupabasePassword(email, password);
    let user = await getProfileById(userId);
    if (!user && (await restoreProfileDeletion(userId))) {
      user = await getProfileById(userId);
    }

    if (!user) {
      return Response.json({ ok: false, error: { code: "UNAUTHORIZED", message: "이메일 또는 비밀번호가 올바르지 않아요.", details: null } }, { status: 401 });
    }
    if (!user.emailVerifiedAt) {
      await patchRows("profiles", `id=eq.${user.id}&email_verified_at=is.null`, {
        email_verified_at: new Date().toISOString(),
        ...(user.onboardingStep === "emailVerification" ? { onboarding_step: "couple_link" } : {}),
      });
      user = await getProfileById(user.id);
      if (!user) {
        return Response.json({ ok: false, error: { code: "UNAUTHORIZED", message: "이메일 또는 비밀번호가 올바르지 않아요.", details: null } }, { status: 401 });
      }
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
