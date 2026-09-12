import type { Couple } from "./types";
import { insertRows, patchRows, selectRows } from "./supabase";
import { ApiError } from "./validation";

export type LetterRow = {
  id: string;
  couple_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  deleted_at: string | null;
  purge_after: string | null;
  created_at: string;
};

export type LetterAttachmentRow = {
  id: string;
  letter_id: string;
  uploaded_by: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  deleted_at: string | null;
  purge_after: string | null;
  created_at: string;
};

export type LetterAttachmentInput = {
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
};

export function partnerUserId(couple: Couple, userId: string): string {
  const partnerId = couple.userIds.find((id) => id !== userId);
  if (!partnerId) {
    throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
  }
  return partnerId;
}

export function toLetter(row: LetterRow, attachments: LetterAttachmentRow[] = []) {
  return {
    id: row.id,
    coupleId: row.couple_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    content: row.content,
    isMine: false,
    isReadByMe: Boolean(row.read_at),
    readAt: row.read_at,
    createdAt: row.created_at,
    attachments: attachments.map(toLetterAttachment),
  };
}

export function toLetterForUser(row: LetterRow, userId: string, attachments: LetterAttachmentRow[] = []) {
  return {
    ...toLetter(row, attachments),
    isMine: row.sender_id === userId,
    isReadByMe: row.recipient_id === userId ? Boolean(row.read_at) : true,
    readAt: row.recipient_id === userId ? row.read_at : null,
  };
}

export function toLetterAttachment(row: LetterAttachmentRow) {
  return {
    id: row.id,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

export function validateLetterContent(content: string): void {
  if (content.length > 1000) {
    throw new ApiError(400, "VALIDATION_ERROR", "문자는 1000자 이하로 적어 주세요.", { content: "max_1000" });
  }
}

export function readAttachmentInputs(body: Record<string, unknown>): LetterAttachmentInput[] {
  const value = body.attachments;
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new ApiError(400, "VALIDATION_ERROR", "첨부 형식이 올바르지 않아요.", { attachments: "array" });
  }
  if (value.length > 4) {
    throw new ApiError(400, "VALIDATION_ERROR", "이미지는 최대 4개까지 첨부할 수 있어요.", { attachments: "max_4" });
  }

  return value.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ApiError(400, "VALIDATION_ERROR", "첨부 형식이 올바르지 않아요.", { [`attachments.${index}`]: "object" });
    }
    const attachment = item as Record<string, unknown>;
    const storagePath = attachment.storagePath;
    const mimeType = attachment.mimeType;
    const sizeBytes = attachment.sizeBytes;
    if (typeof storagePath !== "string" || storagePath.trim().length === 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "첨부 파일 경로가 필요해요.", { [`attachments.${index}.storagePath`]: "required" });
    }
    if (typeof mimeType !== "string" || !mimeType.startsWith("image/")) {
      throw new ApiError(400, "VALIDATION_ERROR", "이미지만 첨부할 수 있어요.", { [`attachments.${index}.mimeType`]: "image" });
    }
    if (typeof sizeBytes !== "number" || !Number.isInteger(sizeBytes) || sizeBytes <= 0) {
      throw new ApiError(400, "VALIDATION_ERROR", "첨부 파일 크기가 올바르지 않아요.", { [`attachments.${index}.sizeBytes`]: "positive_integer" });
    }
    return {
      storagePath: storagePath.trim(),
      mimeType,
      sizeBytes,
    };
  });
}

export async function getLetterAttachments(letterIds: string[]): Promise<Map<string, LetterAttachmentRow[]>> {
  const attachmentMap = new Map<string, LetterAttachmentRow[]>();
  if (letterIds.length === 0) {
    return attachmentMap;
  }
  const attachments = await selectRows<LetterAttachmentRow>(
    "letter_attachments",
    `letter_id=in.(${letterIds.join(",")})&deleted_at=is.null&order=created_at.asc&select=*`,
  );
  for (const attachment of attachments) {
    const existing = attachmentMap.get(attachment.letter_id) ?? [];
    existing.push(attachment);
    attachmentMap.set(attachment.letter_id, existing);
  }
  return attachmentMap;
}

export async function insertLetterAttachments(letterId: string, userId: string, attachments: LetterAttachmentInput[]): Promise<LetterAttachmentRow[]> {
  if (attachments.length === 0) {
    return [];
  }
  return insertRows<LetterAttachmentRow>(
    "letter_attachments",
    attachments.map((attachment) => ({
      letter_id: letterId,
      uploaded_by: userId,
      storage_path: attachment.storagePath,
      mime_type: attachment.mimeType,
      size_bytes: attachment.sizeBytes,
    })),
  );
}

export async function markLetterRead(row: LetterRow, userId: string): Promise<LetterRow> {
  if (row.recipient_id !== userId || row.read_at) {
    return row;
  }
  const [letter] = await patchRows<LetterRow>("letters", `id=eq.${row.id}&recipient_id=eq.${userId}&deleted_at=is.null`, {
    read_at: new Date().toISOString(),
  });
  return letter;
}
