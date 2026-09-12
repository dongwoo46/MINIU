import { requireUser } from "@/app/lib/miniu/auth";
import { fail, ok } from "@/app/lib/miniu/http";
import { type NotificationRow, toNotification } from "@/app/lib/miniu/notifications";
import { selectRows } from "@/app/lib/miniu/supabase";

export async function GET() {
  try {
    const user = await requireUser();
    const notifications = await selectRows<NotificationRow>(
      "notifications",
      `user_id=eq.${user.id}&deleted_at=is.null&order=created_at.desc&limit=50&select=*`,
    );

    return ok({
      notifications: notifications.map(toNotification),
      unreadCount: notifications.filter((notification) => !notification.read_at).length,
    });
  } catch (error) {
    return fail(error);
  }
}
