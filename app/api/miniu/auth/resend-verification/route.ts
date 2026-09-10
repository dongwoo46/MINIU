import { getProfileByEmail } from "@/app/lib/miniu/auth";
import { fail, ok } from "@/app/lib/miniu/http";
import { createVerificationCode, insertVerificationCode } from "@/app/lib/miniu/supabase-auth";
import { assertObject, normalizeEmail, stringField } from "@/app/lib/miniu/validation";

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

    const verificationCode = createVerificationCode();
    await insertVerificationCode(user.id, verificationCode);

    return ok({ devVerificationCode: verificationCode });
  } catch (error) {
    return fail(error);
  }
}
