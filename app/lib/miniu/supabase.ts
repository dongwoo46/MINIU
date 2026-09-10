import { ApiError } from "./validation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new ApiError(500, "INTERNAL_ERROR", `${name} is not configured.`);
  }
  return value;
}

function endpoint(path: string): string {
  return `${requireEnv(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "")}${path}`;
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
  const key = role === "anon" ? requireEnv(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY") : requireEnv(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
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
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Supabase request failed.";
    throw new ApiError(response.status, response.status === 401 ? "UNAUTHORIZED" : "BAD_REQUEST", message);
  }
  return payload;
}

export async function supabaseAuthFetch(path: string, init: RequestInit = {}, role: "anon" | "service" = "service"): Promise<unknown> {
  const key = role === "anon" ? requireEnv(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY") : requireEnv(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY");
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
          : "Supabase Auth request failed.";
    throw new ApiError(response.status, response.status === 401 ? "UNAUTHORIZED" : "BAD_REQUEST", message);
  }
  return payload;
}

export async function selectOne<T>(table: string, query: string): Promise<T | null> {
  const payload = await supabaseFetch(`/rest/v1/${table}?${query}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!Array.isArray(payload)) {
    throw new ApiError(500, "INTERNAL_ERROR", "Unexpected Supabase select response.");
  }
  return (payload[0] as T | undefined) ?? null;
}

export async function selectRows<T>(table: string, query: string): Promise<T[]> {
  const payload = await supabaseFetch(`/rest/v1/${table}?${query}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!Array.isArray(payload)) {
    throw new ApiError(500, "INTERNAL_ERROR", "Unexpected Supabase select response.");
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
    throw new ApiError(500, "INTERNAL_ERROR", "Unexpected Supabase insert response.");
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
    throw new ApiError(500, "INTERNAL_ERROR", "Unexpected Supabase update response.");
  }
  return payload as T[];
}
