import { insertRows, patchRows, selectOne, selectRows } from "./supabase";

export type NotificationType = "couple_connected" | "letter_received" | "affection_received" | "profile_merge_candidate";

export type NotificationRow = {
  id: string;
  user_id: string;
  couple_id: string | null;
  notification_type: NotificationType;
  title: string;
  body: string | null;
  read_at: string | null;
  metadata: Record<string, unknown>;
  deleted_at: string | null;
  purge_after: string | null;
  created_at: string;
};

export type NotificationSettingRow = {
  user_id: string;
  notification_type: NotificationType;
  enabled: boolean;
  updated_at: string;
};

export const notificationTypes: NotificationType[] = ["couple_connected", "letter_received", "affection_received", "profile_merge_candidate"];

export function toNotification(row: NotificationRow) {
  return {
    id: row.id,
    userId: row.user_id,
    coupleId: row.couple_id,
    type: row.notification_type,
    title: row.title,
    body: row.body,
    isRead: Boolean(row.read_at),
    readAt: row.read_at,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

export function toNotificationSetting(row: NotificationSettingRow) {
  return {
    type: row.notification_type,
    enabled: row.enabled,
    updatedAt: row.updated_at,
  };
}

export async function getNotificationSettings(userId: string): Promise<NotificationSettingRow[]> {
  const rows = await selectRows<NotificationSettingRow>("notification_settings", `user_id=eq.${userId}&select=*`);
  const existingTypes = new Set(rows.map((row) => row.notification_type));
  const missingTypes = notificationTypes.filter((type) => !existingTypes.has(type));
  if (missingTypes.length === 0) {
    return rows;
  }

  const insertedRows = await insertRows<NotificationSettingRow>(
    "notification_settings",
    missingTypes.map((type) => ({
      user_id: userId,
      notification_type: type,
      enabled: true,
    })),
  );
  return [...rows, ...insertedRows];
}

export async function isNotificationEnabled(userId: string, type: NotificationType): Promise<boolean> {
  const setting = await selectOne<NotificationSettingRow>("notification_settings", `user_id=eq.${userId}&notification_type=eq.${type}&select=*`);
  return setting?.enabled ?? true;
}

export async function createNotification(input: {
  userId: string;
  coupleId?: string | null;
  type: NotificationType;
  title: string;
  body?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<NotificationRow | null> {
  if (!(await isNotificationEnabled(input.userId, input.type))) {
    return null;
  }
  const [notification] = await insertRows<NotificationRow>("notifications", {
    user_id: input.userId,
    couple_id: input.coupleId ?? null,
    notification_type: input.type,
    title: input.title,
    body: input.body ?? null,
    metadata: input.metadata ?? {},
  });
  return notification;
}

export async function markNotificationRead(row: NotificationRow, userId: string): Promise<NotificationRow> {
  if (row.read_at) {
    return row;
  }
  const [notification] = await patchRows<NotificationRow>("notifications", `id=eq.${row.id}&user_id=eq.${userId}&deleted_at=is.null`, {
    read_at: new Date().toISOString(),
  });
  return notification;
}
