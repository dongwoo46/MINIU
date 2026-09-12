import type { Couple } from "./types";
import { ApiError } from "./validation";

export type AffectionType = "hug" | "kiss" | "pat";

export type AffectionActivityRow = {
  id: string;
  couple_id: string;
  sender_id: string;
  recipient_id: string;
  affection_type: AffectionType;
  deleted_at: string | null;
  purge_after: string | null;
  created_at: string;
};

export const affectionTypes: AffectionType[] = ["hug", "kiss", "pat"];

const affectionLabels: Record<AffectionType, string> = {
  hug: "안아주기",
  kiss: "뽀뽀",
  pat: "쓰다듬기",
};

export function assertAffectionType(value: string): AffectionType {
  if (!affectionTypes.includes(value as AffectionType)) {
    throw new ApiError(400, "VALIDATION_ERROR", "애정표현 종류가 올바르지 않아요.", { affectionType: "invalid" });
  }
  return value as AffectionType;
}

export function affectionTitle(type: AffectionType): string {
  return `${affectionLabels[type]}를 받았어요.`;
}

export function toAffectionActivity(row: AffectionActivityRow, userId: string) {
  return {
    id: row.id,
    coupleId: row.couple_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    type: row.affection_type,
    label: affectionLabels[row.affection_type],
    isMine: row.sender_id === userId,
    createdAt: row.created_at,
  };
}

export function partnerUserId(couple: Couple, userId: string): string {
  const partnerId = couple.userIds.find((id) => id !== userId);
  if (!partnerId) {
    throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
  }
  return partnerId;
}
