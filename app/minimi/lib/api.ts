// 기록/프로필 카드 병합 API 클라이언트.
// 백엔드(app/api/miniu/**)는 requireUser() 세션 쿠키 + 커플 연결을 요구한다.
// /minimi 프로토타입은 로그인 화면이 없어서, 실제 값을 받으려면 dw님이
// 만든 실제 로그인 플로우(/)를 먼저 통과한 세션으로 같은 브라우저에서
// 열어야 한다. 세션이 없으면 401(UNAUTHORIZED), 커플 미연결이면
// 403(FORBIDDEN)이 온다 — 호출부에서 이 두 경우를 구분해서 안내한다.

export type ApiErrorPayload = {
  code: string;
  message: string;
  details: unknown;
};

export class ApiRequestError extends Error {
  code: string;
  status: number;
  details: unknown;

  constructor(status: number, error: ApiErrorPayload) {
    super(error.message);
    this.code = error.code;
    this.status = status;
    this.details = error.details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.ok) {
    const error: ApiErrorPayload = body?.error ?? {
      code: "UNKNOWN_ERROR",
      message: "잠시 후 다시 시도해 주세요.",
      details: null,
    };
    throw new ApiRequestError(response.status, error);
  }
  return body.data as T;
}

export type ApiRecord = {
  id: string;
  userId: string;
  content: string;
  happenedOn: string;
  analysisStatus: "pending" | "complete" | "failedTemporary" | "failedPermanent";
  analysisError: string | null;
  createdAt: string;
};

export type ApiProfileCard = {
  id: string;
  userId: string;
  category: "likes" | "dislikes" | "values" | "habits" | "tendencies";
  content: string;
  sources: { type: string; id: string }[];
  mergeCandidateOf: string | null;
  userEdited: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiMergeCandidate = {
  id: string;
  userId: string;
  sourceCardId: string;
  targetCardId: string;
  status: "pending" | "accepted" | "rejected";
  reason: string | null;
  sourceCard: ApiProfileCard | null;
  targetCard: ApiProfileCard | null;
  createdAt: string;
  decidedAt: string | null;
};

export function listRecords(): Promise<{ records: ApiRecord[] }> {
  return request("/api/miniu/records");
}

export function createRecord(content: string, happenedOn: string): Promise<{ record: ApiRecord; cardCount: number }> {
  return request("/api/miniu/records", {
    method: "POST",
    body: JSON.stringify({ content, happenedOn }),
  });
}

export function deleteRecord(id: string): Promise<{ deletedRecordId: string }> {
  return request(`/api/miniu/records/${id}`, { method: "DELETE" });
}

export function listMergeCandidates(): Promise<{ candidates: ApiMergeCandidate[] }> {
  return request("/api/miniu/profile-cards/merge-candidates");
}

export function mergeProfileCard(sourceCardId: string, targetCardId: string): Promise<{ card: ApiProfileCard }> {
  return request(`/api/miniu/profile-cards/${sourceCardId}/merge`, {
    method: "POST",
    body: JSON.stringify({ targetCardId }),
  });
}

export function rejectMergeCandidate(candidateId: string): Promise<{ candidate: ApiMergeCandidate }> {
  return request(`/api/miniu/profile-cards/merge-candidates/${candidateId}/reject`, {
    method: "POST",
  });
}
