import { createAppSession, getProfileById, publicUser, setSessionCookie } from "@/app/lib/miniu/auth";
import { logEvent } from "@/app/lib/miniu/facts";
import { fail, ok } from "@/app/lib/miniu/http";
import { updateDb } from "@/app/lib/miniu/store";
import { assertObject, normalizeEmail, stringField } from "@/app/lib/miniu/validation";
import { verifySupabasePassword } from "@/app/lib/miniu/supabase-auth";

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const email = normalizeEmail(stringField(body, "email"));
    const password = stringField(body, "password");

    const userId = await verifySupabasePassword(email, password);
    const user = await getProfileById(userId);

    if (!user) {
      return Response.json({ ok: false, error: { code: "UNAUTHORIZED", message: "Invalid email or password.", details: null } }, { status: 401 });
    }
    if (!user.emailVerifiedAt) {
      return Response.json({ ok: false, error: { code: "FORBIDDEN", message: "Email verification is required.", details: null } }, { status: 403 });
    }
    if (!user.requiredConsentsAgreedAt) {
      return Response.json({ ok: false, error: { code: "FORBIDDEN", message: "Required signup consents are required.", details: null } }, { status: 403 });
    }

    const sessionId = await createAppSession(user.id);
    await updateDb((db) => {
      logEvent(db, { userId: user.id, name: "login_completed" });
    });
    await setSessionCookie(sessionId);
    return ok({ user: publicUser(user) });
  } catch (error) {
    return fail(error);
  }
}
