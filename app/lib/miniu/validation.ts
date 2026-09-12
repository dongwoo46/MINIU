import type { ProfileCategory } from "./types";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode,
    message: string,
    public details?: Record<string, string>,
  ) {
    super(message);
  }
}

export function assertObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "BAD_REQUEST", "요청 형식이 올바르지 않아요.");
  }
  return value as Record<string, unknown>;
}

export function stringField(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "필수 값을 입력해 주세요.", { [field]: "required" });
  }
  return value.trim();
}

export function optionalStringField(body: Record<string, unknown>, field: string): string | undefined {
  const value = body[field];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new ApiError(400, "VALIDATION_ERROR", "입력값 형식이 올바르지 않아요.", { [field]: "string" });
  }
  return value.trim();
}

export function booleanField(body: Record<string, unknown>, field: string): boolean {
  if (typeof body[field] !== "boolean") {
    throw new ApiError(400, "VALIDATION_ERROR", "체크값 형식이 올바르지 않아요.", { [field]: "boolean" });
  }
  return body[field];
}

export function stringArrayField(body: Record<string, unknown>, field: string): string[] {
  const value = body[field];
  if (!Array.isArray(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", "답변을 입력해 주세요.", { [field]: "array" });
  }
  const cleaned = value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  if (cleaned.length === 0 || cleaned.length !== value.length) {
    throw new ApiError(400, "VALIDATION_ERROR", "빈 답변은 저장할 수 없어요.", { [field]: "non_empty_strings" });
  }
  return cleaned;
}

export function validateEmail(email: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "VALIDATION_ERROR", "이메일 형식이 올바르지 않아요.", { email: "invalid" });
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePassword(password: string): void {
  if (password.length < 8 || password.length > 16 || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new ApiError(400, "VALIDATION_ERROR", "비밀번호는 8~16자, 숫자와 특수문자를 포함해야 해요.", {
      password: "weak",
    });
  }
}

export function validateDate(value: string, field: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))) {
    throw new ApiError(400, "VALIDATION_ERROR", "날짜 형식이 올바르지 않아요.", { [field]: "date" });
  }
}

export function validateAge14OrOver(birthDate: string, now = new Date()): void {
  const birthday = new Date(`${birthDate}T00:00:00.000Z`);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let age = today.getUTCFullYear() - birthday.getUTCFullYear();
  const birthdayThisYear = new Date(Date.UTC(today.getUTCFullYear(), birthday.getUTCMonth(), birthday.getUTCDate()));
  if (today < birthdayThisYear) {
    age -= 1;
  }
  if (age < 14) {
    throw new ApiError(400, "VALIDATION_ERROR", "만 14세 미만은 가입할 수 없어요.", { birthDate: "under_14" });
  }
}

export function validateRecordContent(content: string): void {
  if (content.length > 150) {
    throw new ApiError(400, "VALIDATION_ERROR", "기록은 150자 이하로 적어 주세요.", { content: "max_150" });
  }
}

export function validateCategory(category: string): ProfileCategory {
  const allowed: ProfileCategory[] = ["likes", "dislikes", "values", "habits", "tendencies"];
  if (!allowed.includes(category as ProfileCategory)) {
    throw new ApiError(400, "VALIDATION_ERROR", "카테고리가 올바르지 않아요.", { category: "invalid" });
  }
  return category as ProfileCategory;
}
