export type ApiFailure = {
  ok: false;
  error: { code: string; message: string; details: Record<string, string> | null };
};

type ApiSuccess<T> = { ok: true; data: T };

export class MiniuApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: Record<string, string> | null,
  ) {
    super(message);
  }
}

export type Miniu = {
  id: string;
  userId: string;
  name: string;
  preset: string;
  hairStyle: string;
  hairColor: string;
  skinTone: string;
  faceShape: string;
  expression: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryItem = {
  id: string;
  userId: string;
  suggestionId: string | null;
  name: string;
  assetKey: string;
  equipped: boolean;
  createdAt: string;
};

export type HouseData = {
  coupleId: string;
  backgroundKey: string;
  me: { userId: string; miniu: Miniu | null; equippedItems: InventoryItem[] };
  partner: { userId: string; miniu: Miniu | null; equippedItems: InventoryItem[] };
  locks: { canVisit: boolean; canCustomizeMiniu: boolean; canUseInventory: boolean; needsMiniu: boolean };
};

export type ChatQuota = {
  limit: number;
  used: number;
  remaining: number;
  resetsAt: string;
};

export type Letter = {
  id: string;
  coupleId: string;
  senderId: string;
  recipientId: string;
  content: string;
  isMine: boolean;
  isReadByMe: boolean;
  readAt: string | null;
  createdAt: string;
  attachments: { id: string; storagePath: string; mimeType: string; sizeBytes: number; createdAt: string }[];
};

export type ProfileCardData = {
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

export type NotificationData = {
  id: string;
  userId: string;
  coupleId: string | null;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  readAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ItemSuggestion = {
  id: string;
  userId: string;
  keyword: string;
  itemName: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  decidedAt: string | null;
};

export type AffectionActivity = {
  id: string;
  coupleId: string;
  senderId: string;
  recipientId: string;
  affectionType: "hug" | "kiss" | "pat";
  direction: "sent" | "received";
  createdAt: string;
};

export async function miniuRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: init?.method ? undefined : "no-store",
  });
  const payload = (await response.json().catch(() => null)) as ApiSuccess<T> | ApiFailure | null;
  if (!response.ok || !payload?.ok) {
    const error = payload && !payload.ok ? payload.error : { code: "UNKNOWN_ERROR", message: "요청 처리에 실패했어요.", details: null };
    throw new MiniuApiError(response.status, error.code, error.message, error.details);
  }
  return payload.data;
}

export function getHouse(): Promise<HouseData> {
  return miniuRequest("/api/miniu/house");
}

export function getChatQuota(): Promise<ChatQuota> {
  return miniuRequest("/api/miniu/chat/quota");
}

export function sendChatMessage(message: string): Promise<{ reply: string; usage: ChatQuota }> {
  return miniuRequest("/api/miniu/chat", { method: "POST", body: JSON.stringify({ message }) });
}

export function sendAffection(affectionType: AffectionActivity["affectionType"]): Promise<{ activity: AffectionActivity; notificationGrouped: boolean }> {
  return miniuRequest("/api/miniu/affections", { method: "POST", body: JSON.stringify({ affectionType }) });
}

export function listLetters(): Promise<{ letters: Letter[]; unreadCount: number }> {
  return miniuRequest("/api/miniu/letters");
}

export function createLetter(content: string): Promise<{ letter: Letter; failedAttachmentCount: number; cardCount: number }> {
  return miniuRequest("/api/miniu/letters", { method: "POST", body: JSON.stringify({ content }) });
}

export function markLetterRead(id: string): Promise<{ letter: Letter }> {
  return miniuRequest(`/api/miniu/letters/${id}/read`, { method: "PATCH" });
}

export function listProfileCards(): Promise<{ cards: ProfileCardData[] }> {
  return miniuRequest("/api/miniu/profile-cards");
}

export function updateProfileCard(id: string, input: { content?: string; category?: ProfileCardData["category"] }): Promise<{ card: ProfileCardData }> {
  return miniuRequest(`/api/miniu/profile-cards/${id}`, { method: "PATCH", body: JSON.stringify(input) });
}

export function deleteProfileCard(id: string): Promise<{ deletedCardId: string }> {
  return miniuRequest(`/api/miniu/profile-cards/${id}`, { method: "DELETE" });
}

export function createMiniu(name: string): Promise<{ miniu: Miniu }> {
  return miniuRequest("/api/miniu/miniu", { method: "POST", body: JSON.stringify({ name }) });
}

export function listNotifications(): Promise<{ notifications: NotificationData[]; unreadCount: number }> {
  return miniuRequest("/api/miniu/notifications");
}

export function markNotificationRead(id: string): Promise<{ notification: NotificationData }> {
  return miniuRequest(`/api/miniu/notifications/${id}/read`, { method: "PATCH" });
}

export function listInventory(): Promise<{ items: InventoryItem[]; limit: number }> {
  return miniuRequest("/api/miniu/inventory");
}

export function listItemSuggestions(): Promise<{ suggestions: ItemSuggestion[] }> {
  return miniuRequest("/api/miniu/item-suggestions");
}

export function acceptItemSuggestion(id: string): Promise<{ suggestion: ItemSuggestion; item: InventoryItem }> {
  return miniuRequest(`/api/miniu/item-suggestions/${id}/accept`, { method: "POST" });
}

export function rejectItemSuggestion(id: string): Promise<{ suggestion: ItemSuggestion }> {
  return miniuRequest(`/api/miniu/item-suggestions/${id}/reject`, { method: "POST" });
}

export function updateInventoryItem(id: string, equipped: boolean): Promise<{ item: InventoryItem }> {
  return miniuRequest(`/api/miniu/inventory/${id}`, { method: "PATCH", body: JSON.stringify({ equipped }) });
}
