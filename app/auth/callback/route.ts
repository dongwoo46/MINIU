import { NextResponse } from "next/server";
import { createAppSession, getProfileById, setSessionCookie } from "@/app/lib/miniu/auth";
import { patchRows } from "@/app/lib/miniu/supabase";
import { ApiError } from "@/app/lib/miniu/validation";
import { verifySignupToken } from "@/app/lib/miniu/supabase-auth";

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function safeLocalRedirect(targetPath: string | null | undefined): URL {
  const base = new URL(getSiteUrl());
  if (!targetPath) {
    return new URL("/", base);
  }
  const destination = new URL(targetPath, base);
  return destination.origin === base.origin ? destination : new URL("/", base);
}

function redirectWithAuthMessage(params: { message: string; status?: "ok" | "error"; next?: string | null }): NextResponse {
  const fallback = params.next && params.next.trim().length ? params.next : "/";
  const target = safeLocalRedirect(fallback);
  target.searchParams.set("auth", params.status === "error" ? "verify_error" : "verified");
  target.searchParams.set("authMessage", params.message);
  return NextResponse.redirect(target);
}

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const query = requestUrl.searchParams;

  if (query.has("error")) {
    return redirectWithAuthMessage({
      status: "error",
      message: query.get("error_description") || "이메일 인증 링크가 유효하지 않아요.",
      next: query.get("next"),
    });
  }

  const token = query.get("token");
  const tokenHash = query.get("token_hash");
  const redirectTo = query.get("redirect_to") || query.get("next");
  const type = query.get("type") ?? "signup";

  if (!token && !tokenHash) {
    return redirectWithAuthMessage({
      status: "error",
      message: "인증 토큰이 없어요.",
      next: redirectTo,
    });
  }

  const normalizedType = type === "email" || type === "magiclink" ? type : "signup";

  try {
    const userId = await verifySignupToken({
      token: token ?? undefined,
      tokenHash: tokenHash ?? undefined,
      type: normalizedType,
    });
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
    const nextUrl = safeLocalRedirect(redirectTo);
    nextUrl.searchParams.set("auth", "verified");
    nextUrl.searchParams.set("authMessage", `이메일 인증이 완료됐어요. ${user.name}님 환영해요.`);
    return NextResponse.redirect(nextUrl);
  } catch (error) {
    if (error instanceof ApiError && error.code === "FORBIDDEN") {
      return redirectWithAuthMessage({
        status: "error",
        message: "이메일 인증 정보가 이미 처리되었거나 만료됐어요.",
        next: redirectTo,
      });
    }
    return redirectWithAuthMessage({
      status: "error",
      message: "이메일 인증 처리에 실패했어요. 다시 시도해 주세요.",
      next: redirectTo,
    });
  }
}
