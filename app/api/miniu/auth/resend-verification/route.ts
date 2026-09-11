import { getProfileByEmail } from "@/app/lib/miniu/auth";
import { fail, ok } from "@/app/lib/miniu/http";
import { assertObject, normalizeEmail, stringField } from "@/app/lib/miniu/validation";
import { requestSignupVerificationEmail } from "@/app/lib/miniu/supabase-auth";

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const email = normalizeEmail(stringField(body, "email"));

    const user = await getProfileByEmail(email);

    if (!user) {
      return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "User was not found.", details: null } }, { status: 404 });
    }
    if (user.emailVerifiedAt) {
      return Response.json({ ok: false, error: { code: "CONFLICT", message: "Email is already verified.", details: null } }, { status: 409 });
    }

    await requestSignupVerificationEmail(user.email);

    return ok({ ok: true });
  } catch (error) {
    return fail(error);
  }
}
