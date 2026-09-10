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
    throw new ApiError(400, "BAD_REQUEST", "JSON object body is required.");
  }
  return value as Record<string, unknown>;
}

export function stringField(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} is required.`, { [field]: "required" });
  }
  return value.trim();
}

export function optionalStringField(body: Record<string, unknown>, field: string): string | undefined {
  const value = body[field];
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} must be a string.`, { [field]: "string" });
  }
  return value.trim();
}

export function booleanField(body: Record<string, unknown>, field: string): boolean {
  if (typeof body[field] !== "boolean") {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} must be boolean.`, { [field]: "boolean" });
  }
  return body[field];
}

export function stringArrayField(body: Record<string, unknown>, field: string): string[] {
  const value = body[field];
  if (!Array.isArray(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} must be a non-empty string array.`, { [field]: "array" });
  }
  const cleaned = value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  if (cleaned.length === 0 || cleaned.length !== value.length) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} must contain only non-empty strings.`, { [field]: "non_empty_strings" });
  }
  return cleaned;
}

export function validateEmail(email: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid email.", { email: "invalid" });
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePassword(password: string): void {
  if (password.length < 8 || password.length > 16 || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Password must be 8-16 chars and include a number and special character.", {
      password: "weak",
    });
  }
}

export function validateDate(value: string, field: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))) {
    throw new ApiError(400, "VALIDATION_ERROR", `${field} must be YYYY-MM-DD.`, { [field]: "date" });
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
    throw new ApiError(400, "VALIDATION_ERROR", "Users under 14 cannot sign up.", { birthDate: "under_14" });
  }
}

export function validateRecordContent(content: string): void {
  if (content.length > 150) {
    throw new ApiError(400, "VALIDATION_ERROR", "Record content must be 150 characters or less.", { content: "max_150" });
  }
}

export function validateCategory(category: string): ProfileCategory {
  const allowed: ProfileCategory[] = ["likes", "dislikes", "values", "habits", "tendencies"];
  if (!allowed.includes(category as ProfileCategory)) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid profile category.", { category: "invalid" });
  }
  return category as ProfileCategory;
}
