import { NextResponse } from "next/server";
import { ApiError } from "./validation";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { ok: false, error: { code: error.code, message: error.message, details: error.details ?? null } },
      { status: error.status },
    );
  }

  console.error(error);
  return NextResponse.json(
    { ok: false, error: { code: "INTERNAL_ERROR", message: "잠시 후 다시 시도해 주세요.", details: null } },
    { status: 500 },
  );
}
