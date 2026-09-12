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
        throw new ApiError(403, "FORBIDDEN", "Email verification is required.");
      }
      if (error.status === 400 || error.status === 401) {
        throw new ApiError(401, "UNAUTHORIZED", "Invalid email or password.");
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
    throw new ApiError(400, "BAD_REQUEST", "Verification token is required.");
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
