import { createAppSession, getProfileById, publicUser, setSessionCookie } from "@/app/lib/miniu/auth";
import { fail, ok } from "@/app/lib/miniu/http";
import { patchRows } from "@/app/lib/miniu/supabase";
import { ApiError, assertObject, optionalStringField } from "@/app/lib/miniu/validation";
import { verifySignupToken } from "@/app/lib/miniu/supabase-auth";

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const token = optionalStringField(body, "token");
    const tokenHash = optionalStringField(body, "tokenHash") ?? optionalStringField(body, "token_hash");
    const type = optionalStringField(body, "type");

    const userId = await verifySignupToken({
      token,
      tokenHash,
      type: type && ["signup", "email", "magiclink"].includes(type) ? (type as "signup" | "email" | "magiclink") : "signup",
    });
    if (!userId) {
      return Response.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Invalid verification token.", details: null } }, { status: 401 });
    }

    await patchRows("profiles", `id=eq.${userId}`, {
      email_verified_at: new Date().toISOString(),
      onboarding_step: "couple_link",
    });
    const user = await getProfileById(userId);
    if (!user) {
      throw new ApiError(500, "INTERNAL_ERROR", "Verified user profile was not found.");
    }

    const sessionId = await createAppSession(user.id);
    await setSessionCookie(sessionId);
    return ok({ user: publicUser(user) });
  } catch (error) {
    return fail(error);
  }
}
