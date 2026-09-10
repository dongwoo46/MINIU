import { publicUser, getProfileByEmail, getProfileById } from "@/app/lib/miniu/auth";
import { insertSignupConsents, requiredSignupConsentFields, type SignupConsentInput } from "@/app/lib/miniu/consents";
import { logEvent } from "@/app/lib/miniu/facts";
import { fail, ok } from "@/app/lib/miniu/http";
import { updateDb } from "@/app/lib/miniu/store";
import { insertRows } from "@/app/lib/miniu/supabase";
import { createSupabaseAuthUser, createVerificationCode, insertVerificationCode } from "@/app/lib/miniu/supabase-auth";
import {
  ApiError,
  assertObject,
  booleanField,
  normalizeEmail,
  validateAge14OrOver,
  stringField,
  validateDate,
  validateEmail,
  validatePassword,
} from "@/app/lib/miniu/validation";

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const name = stringField(body, "name");
    const birthDate = stringField(body, "birthDate");
    const email = normalizeEmail(stringField(body, "email"));
    const password = stringField(body, "password");
    const consents = readSignupConsents(body);

    validateDate(birthDate, "birthDate");
    validateAge14OrOver(birthDate);
    validateEmail(email);
    validatePassword(password);
    const missingConsent = requiredSignupConsentFields.find((field) => !consents[field]);
    if (missingConsent) {
      throw new ApiError(400, "VALIDATION_ERROR", "Required signup consent is missing.", { [missingConsent]: "required" });
    }

    if (await getProfileByEmail(email)) {
      return Response.json({ ok: false, error: { code: "CONFLICT", message: "Email is already registered.", details: null } }, { status: 409 });
    }

    const now = new Date().toISOString();
    const userId = await createSupabaseAuthUser({ email, password, name, birthDate });
    await insertRows("profiles", {
      id: userId,
      email,
      name,
      birth_date: birthDate,
      terms_agreed_at: now,
      required_consents_agreed_at: now,
      marketing_agreed_at: consents.marketing ? now : null,
      onboarding_step: "email_verification",
    });
    await insertSignupConsents({
      userId,
      consents,
      agreedAt: now,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip"),
      userAgent: request.headers.get("user-agent"),
    });

    const verificationCode = createVerificationCode();
    await insertVerificationCode(userId, verificationCode);
    await updateDb((db) => {
      logEvent(db, { userId, name: "signup_completed" });
    });

    const user = await getProfileById(userId);
    if (!user) {
      throw new ApiError(500, "INTERNAL_ERROR", "Created user profile was not found.");
    }

    return ok({
      user: publicUser(user),
      devVerificationCode: verificationCode,
    });
  } catch (error) {
    return fail(error);
  }
}

function readSignupConsents(body: Record<string, unknown>): SignupConsentInput {
  return {
    terms: booleanField(body, "terms"),
    privacyRequired: booleanField(body, "privacyRequired"),
    processorTransferNotice: booleanField(body, "processorTransferNotice"),
    aiAnalysisTransfer: booleanField(body, "aiAnalysisTransfer"),
    partnerInfoResponsibility: booleanField(body, "partnerInfoResponsibility"),
    age14OrOver: booleanField(body, "age14OrOver"),
    marketing: typeof body.marketing === "boolean" ? body.marketing : false,
  };
}
