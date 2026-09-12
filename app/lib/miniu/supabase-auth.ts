import { ApiError } from "./validation";
import { supabaseAuthFetch } from "./supabase";

type SupabaseAuthUser = {
  id: string;
  email?: string;
};

type SupabaseAuthUserPayload = {
  id?: string;
  user?: SupabaseAuthUser;
};

type SignupVerificationType = "signup" | "email" | "magiclink";

function authSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function authUserId(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    throw new ApiError(500, "INTERNAL_ERROR", "인증 응답을 확인하지 못했어요.");
  }
  const data = payload as SupabaseAuthUserPayload;
  const id = data.user?.id ?? data.id;
  if (!id) {
    throw new ApiError(500, "INTERNAL_ERROR", "인증 정보를 확인하지 못했어요.");
  }
  return id;
}

export async function createSupabaseAuthUser(input: { email: string; password: string; name: string; birthDate: string }): Promise<string> {
  const payload = await supabaseAuthFetch(
    "/signup",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        data: {
          name: input.name,
          birthDate: input.birthDate,
        },
        options: {
          emailRedirectTo: `${authSiteUrl()}/auth/callback`,
        },
      }),
    },
    "anon",
  );
  return authUserId(payload);
}

export async function deleteSupabaseAuthUser(userId: string): Promise<void> {
  await supabaseAuthFetch(
    `/admin/users/${userId}`,
    {
      method: "DELETE",
    },
    "service",
  );
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
    if (error instanceof ApiError) {
      const hasNotConfirmedMessage = error.message.toLowerCase().includes("confirm");
      if (hasNotConfirmedMessage && error.status === 400) {
        throw new ApiError(403, "FORBIDDEN", "이메일 인증이 필요해요.");
      }
      if (error.status === 400 || error.status === 401) {
        throw new ApiError(401, "UNAUTHORIZED", "이메일 또는 비밀번호가 올바르지 않아요.");
      }
    }
    throw error;
  }
}

export async function requestSignupVerificationEmail(email: string): Promise<void> {
  await supabaseAuthFetch(
    "/resend",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        type: "signup",
        options: {
          emailRedirectTo: `${authSiteUrl()}/auth/callback`,
        },
      }),
    },
    "anon",
  );
}

export async function verifySignupToken(params: {
  token?: string;
  tokenHash?: string;
  type?: SignupVerificationType;
}): Promise<string> {
  const { token, tokenHash } = params;
  if (!token && !tokenHash) {
    throw new ApiError(400, "BAD_REQUEST", "인증 토큰이 필요해요.");
  }

  const payload = await supabaseAuthFetch(
    "/verify",
    {
      method: "POST",
      body: JSON.stringify({
        ...(token ? { token } : {}),
        ...(tokenHash ? { token_hash: tokenHash } : {}),
        type: params.type ?? "signup",
      }),
    },
    "anon",
  );

  if (payload && typeof payload === "object" && "user" in payload && payload.user && typeof payload.user === "object") {
    return authUserId(payload.user);
  }
  if (payload && typeof payload === "object" && "id" in payload && typeof (payload as { id?: unknown }).id === "string") {
    return (payload as { id: string }).id;
  }
  return authUserId(payload);
}
