import { ApiError } from "./validation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(value: string | undefined): string {
  if (!value) {
    throw new ApiError(500, "INTERNAL_ERROR", "서버 설정이 필요해요.");
  }
  return value;
}

function endpoint(path: string): string {
  return `${requireEnv(supabaseUrl).replace(/\/$/, "")}${path}`;
}

function authEndpoint(path: string): string {
  return endpoint(`/auth/v1${path}`);
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function supabaseFetch(path: string, init: RequestInit = {}, role: "anon" | "service" = "service"): Promise<unknown> {
  const key = role === "anon" ? requireEnv(anonKey) : requireEnv(serviceRoleKey);
  const response = await fetch(endpoint(path), {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new ApiError(response.status, response.status === 401 ? "UNAUTHORIZED" : "BAD_REQUEST", "요청 처리에 실패했어요.");
  }
  return payload;
}

export async function supabaseAuthFetch(path: string, init: RequestInit = {}, role: "anon" | "service" = "service"): Promise<unknown> {
  const key = role === "anon" ? requireEnv(anonKey) : requireEnv(serviceRoleKey);
  const response = await fetch(authEndpoint(path), {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  const payload = await readJson(response);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "msg" in payload && typeof payload.msg === "string"
        ? payload.msg
        : payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "인증 요청에 실패했어요.";
    throw new ApiError(response.status, response.status === 401 ? "UNAUTHORIZED" : "BAD_REQUEST", message);
  }
  return payload;
}

export async function supabaseStorageFetch(path: string, init: RequestInit = {}): Promise<unknown> {
  const key = requireEnv(serviceRoleKey);
  const response = await fetch(endpoint(`/storage/v1${path}`), {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...init.headers,
    },
    cache: "no-store",
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new ApiError(response.status, response.status === 401 ? "UNAUTHORIZED" : "BAD_REQUEST", "파일 업로드에 실패했어요.");
  }
  return payload;
}

export async function selectOne<T>(table: string, query: string): Promise<T | null> {
  const payload = await supabaseFetch(`/rest/v1/${table}?${query}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!Array.isArray(payload)) {
    throw new ApiError(500, "INTERNAL_ERROR", "데이터를 불러오지 못했어요.");
  }
  return (payload[0] as T | undefined) ?? null;
}

export async function selectRows<T>(table: string, query: string): Promise<T[]> {
  const payload = await supabaseFetch(`/rest/v1/${table}?${query}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!Array.isArray(payload)) {
    throw new ApiError(500, "INTERNAL_ERROR", "데이터를 불러오지 못했어요.");
  }
  return payload as T[];
}

export async function insertRows<T>(table: string, rows: Record<string, unknown> | Record<string, unknown>[]): Promise<T[]> {
  const payload = await supabaseFetch(`/rest/v1/${table}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(rows),
  });
  if (!Array.isArray(payload)) {
    throw new ApiError(500, "INTERNAL_ERROR", "데이터를 저장하지 못했어요.");
  }
  return payload as T[];
}

export async function patchRows<T>(table: string, query: string, values: Record<string, unknown>): Promise<T[]> {
  const payload = await supabaseFetch(`/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(values),
  });
  if (!Array.isArray(payload)) {
    throw new ApiError(500, "INTERNAL_ERROR", "데이터를 수정하지 못했어요.");
  }
  return payload as T[];
}
