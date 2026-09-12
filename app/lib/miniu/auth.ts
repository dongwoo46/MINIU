import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { MiniuDb, Session, User } from "./types";
import { hashLookupValue } from "./crypto";
import { ApiError } from "./validation";
import { insertRows, patchRows, selectOne } from "./supabase";

export const sessionCookieName = "miniu_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 30;

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  birth_date: string;
  email_verified_at: string | null;
  terms_agreed_at: string;
  required_consents_agreed_at: string | null;
  marketing_agreed_at: string | null;
  onboarding_step: "email_verification" | "couple_link" | "pre_questions" | "home";
  deleted_at: string | null;
  purge_after: string | null;
  created_at: string;
};

type AppSessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
};

export function toUser(profile: ProfileRow): User {
  return {
    id: profile.id,
    name: profile.name,
    birthDate: profile.birth_date,
    email: profile.email,
    emailVerifiedAt: profile.email_verified_at,
    termsAgreedAt: profile.terms_agreed_at,
    requiredConsentsAgreedAt: profile.required_consents_agreed_at,
    marketingAgreedAt: profile.marketing_agreed_at,
    onboardingStep:
      profile.onboarding_step === "email_verification"
        ? "emailVerification"
        : profile.onboarding_step === "couple_link"
          ? "coupleLink"
          : profile.onboarding_step === "pre_questions"
            ? "preQuestions"
            : "home",
    createdAt: profile.created_at,
    deletedAt: profile.deleted_at,
  };
}

export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    birthDate: user.birthDate,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    onboardingStep: user.onboardingStep,
    createdAt: user.createdAt,
    requiredConsentsAgreedAt: user.requiredConsentsAgreedAt,
    marketingAgreedAt: user.marketingAgreedAt,
  };
}

export function createSession(db: MiniuDb, userId: string): Session {
  const now = new Date();
  const session: Session = {
    id: randomBytes(32).toString("hex"),
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + sessionMaxAgeSeconds * 1000).toISOString(),
  };
  db.sessions.push(session);
  return session;
}

export async function createAppSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000).toISOString();
  await insertRows("app_sessions", {
    user_id: userId,
    token_hash: hashLookupValue(token),
    expires_at: expiresAt,
  });
  return token;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const store = await cookies();
  store.set(sessionCookieName, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(sessionCookieName);
}

export async function getSessionId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(sessionCookieName)?.value;
}

export async function revokeCurrentAppSession(): Promise<void> {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return;
  }
  await patchRows("app_sessions", `token_hash=eq.${hashLookupValue(sessionId)}&revoked_at=is.null`, {
    revoked_at: new Date().toISOString(),
  });
}

export async function getProfileById(id: string): Promise<User | null> {
  const profile = await selectOne<ProfileRow>("profiles", `id=eq.${id}&deleted_at=is.null&select=*`);
  return profile ? toUser(profile) : null;
}

export async function restoreProfileDeletion(userId: string, now = new Date()): Promise<boolean> {
  const profile = await selectOne<ProfileRow>("profiles", `id=eq.${userId}&deleted_at=not.is.null&select=*`);
  if (!profile || !profile.purge_after || Date.parse(profile.purge_after) <= now.getTime()) {
    return false;
  }
  await patchRows("profiles", `id=eq.${userId}`, {
    deleted_at: null,
    purge_after: null,
  });
  return true;
}

export async function getProfileByEmail(email: string): Promise<User | null> {
  const profile = await selectOne<ProfileRow>("profiles", `email=eq.${encodeURIComponent(email)}&deleted_at=is.null&select=*`);
  return profile ? toUser(profile) : null;
}

export async function requireUser(db?: MiniuDb): Promise<User> {
  void db;
  const sessionId = await getSessionId();
  if (!sessionId) {
    throw new ApiError(401, "UNAUTHORIZED", "로그인이 필요해요.");
  }

  const now = new Date().toISOString();
  const session = await selectOne<AppSessionRow>(
    "app_sessions",
    `token_hash=eq.${hashLookupValue(sessionId)}&revoked_at=is.null&expires_at=gt.${encodeURIComponent(now)}&select=*`,
  );
  if (!session) {
    throw new ApiError(401, "UNAUTHORIZED", "다시 로그인해 주세요.");
  }

  const user = await getProfileById(session.user_id);
  if (!user) {
    throw new ApiError(401, "UNAUTHORIZED", "계정을 찾을 수 없어요.");
  }
  if (!user.emailVerifiedAt) {
    throw new ApiError(403, "FORBIDDEN", "이메일 인증이 필요해요.");
  }
  if (!user.requiredConsentsAgreedAt) {
    throw new ApiError(403, "FORBIDDEN", "필수 동의가 필요해요.");
  }
  return user;
}

export function requireCouple(db: MiniuDb, userId: string) {
  const couple = db.couples.find((item) => item.status === "connected" && item.userIds.includes(userId));
  if (!couple) {
    throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
  }
  return couple;
}

export function getConnectedCouple(db: MiniuDb, userId: string) {
  return db.couples.find((item) => item.status === "connected" && item.userIds.includes(userId)) ?? null;
}
