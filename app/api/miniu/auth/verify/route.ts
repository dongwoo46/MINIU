import { createAppSession, getProfileByEmail, getProfileById, publicUser, setSessionCookie } from "@/app/lib/miniu/auth";
import { logEvent } from "@/app/lib/miniu/facts";
import { fail, ok } from "@/app/lib/miniu/http";
import { updateDb } from "@/app/lib/miniu/store";
import { patchRows } from "@/app/lib/miniu/supabase";
import { consumeVerificationCode, findActiveVerificationCode } from "@/app/lib/miniu/supabase-auth";
import { ApiError, assertObject, normalizeEmail, stringField } from "@/app/lib/miniu/validation";

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const email = normalizeEmail(stringField(body, "email"));
    const code = stringField(body, "code");

    const profile = await getProfileByEmail(email);
    if (!profile) {
      return Response.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Invalid verification code.", details: null } }, { status: 401 });
    }
    if (profile.emailVerifiedAt) {
      return Response.json({ ok: false, error: { code: "CONFLICT", message: "Email is already verified.", details: null } }, { status: 409 });
    }

    const verificationCode = await findActiveVerificationCode(profile.id, code);
    if (!verificationCode) {
      return Response.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Invalid verification code.", details: null } }, { status: 401 });
    }

    await consumeVerificationCode(verificationCode.id);
    await patchRows("profiles", `id=eq.${profile.id}`, {
      email_verified_at: new Date().toISOString(),
      onboarding_step: "couple_link",
    });
    const user = await getProfileById(profile.id);
    if (!user) {
      throw new ApiError(500, "INTERNAL_ERROR", "Verified user profile was not found.");
    }

    const sessionId = await createAppSession(user.id);
    await updateDb((db) => {
      logEvent(db, { userId: user.id, name: "email_verified" });
    });
    await setSessionCookie(sessionId);
    return ok({ user: publicUser(user) });
  } catch (error) {
    return fail(error);
  }
}
