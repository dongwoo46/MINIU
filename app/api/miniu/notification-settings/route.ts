import { requireUser } from "@/app/lib/miniu/auth";
import { fail, ok } from "@/app/lib/miniu/http";
import { getNotificationSettings, notificationTypes, type NotificationSettingRow, toNotificationSetting } from "@/app/lib/miniu/notifications";
import { patchRows } from "@/app/lib/miniu/supabase";
import { ApiError, assertObject } from "@/app/lib/miniu/validation";

export async function GET() {
  try {
    const user = await requireUser();
    const settings = await getNotificationSettings(user.id);
    return ok({ settings: settings.map(toNotificationSetting) });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = assertObject(await request.json());
    const user = await requireUser();
    const updates = readSettings(body);
    await getNotificationSettings(user.id);

    const settings = (
      await Promise.all(
        Object.entries(updates).map(([type, enabled]) =>
          patchRows<NotificationSettingRow>("notification_settings", `user_id=eq.${user.id}&notification_type=eq.${type}`, { enabled }),
        ),
      )
    ).flat();

    return ok({ settings: settings.map(toNotificationSetting) });
  } catch (error) {
    return fail(error);
  }
}

function readSettings(body: Record<string, unknown>): Partial<Record<string, boolean>> {
  const updates: Partial<Record<string, boolean>> = {};
  for (const type of notificationTypes) {
    if (body[type] === undefined) {
      continue;
    }
    if (typeof body[type] !== "boolean") {
      throw new ApiError(400, "VALIDATION_ERROR", "알림 설정 형식이 올바르지 않아요.", { [type]: "boolean" });
    }
    updates[type] = body[type];
  }
  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, "VALIDATION_ERROR", "변경할 알림 설정이 없어요.");
  }
  return updates;
}
