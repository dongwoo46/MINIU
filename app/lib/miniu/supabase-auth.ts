import { hashLookupValue } from "./crypto";
import { ApiError } from "./validation";
import { insertRows, patchRows, selectOne, supabaseAuthFetch } from "./supabase";

type SupabaseAuthUser = {
  id: string;
  email?: string;
};

type SupabaseAuthUserPayload = {
  id?: string;
  user?: SupabaseAuthUser;
};

type EmailVerificationCodeRow = {
  id: string;
  user_id: string;
  code_hash: string;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
};

const verificationCodeTtlMinutes = 30;

function authUserId(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    throw new ApiError(500, "INTERNAL_ERROR", "Unexpected Supabase Auth response.");
  }
  const data = payload as SupabaseAuthUserPayload;
  const id = data.user?.id ?? data.id;
  if (!id) {
    throw new ApiError(500, "INTERNAL_ERROR", "Supabase Auth user id was missing.");
  }
  return id;
}

export async function createSupabaseAuthUser(input: { email: string; password: string; name: string; birthDate: string }): Promise<string> {
  const payload = await supabaseAuthFetch("/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        name: input.name,
        birthDate: input.birthDate,
      },
    }),
  });
  return authUserId(payload);
}

export async function verifySupabasePassword(email: string, password: string): Promise<string> {
  try {
    const payload = await supabaseAuthFetch(
      "/token?grant_type=password",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      "anon",
    );
    return authUserId(payload);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 400 || error.status === 401)) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid email or password.");
    }
    throw error;
  }
}

export function createVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function insertVerificationCode(userId: string, code: string): Promise<void> {
  const expiresAt = new Date(Date.now() + verificationCodeTtlMinutes * 60 * 1000).toISOString();
  await insertRows("email_verification_codes", {
    user_id: userId,
    code_hash: hashLookupValue(code),
    expires_at: expiresAt,
  });
}

export async function findActiveVerificationCode(userId: string, code: string): Promise<EmailVerificationCodeRow | null> {
  const now = new Date().toISOString();
  return selectOne<EmailVerificationCodeRow>(
    "email_verification_codes",
    `user_id=eq.${userId}&code_hash=eq.${hashLookupValue(code)}&consumed_at=is.null&expires_at=gt.${encodeURIComponent(now)}&order=created_at.desc&limit=1&select=*`,
  );
}

export async function consumeVerificationCode(id: string): Promise<void> {
  await patchRows("email_verification_codes", `id=eq.${id}`, {
    consumed_at: new Date().toISOString(),
  });
}
