import { requireUser } from "@/app/lib/miniu/auth";
import { fail, ok } from "@/app/lib/miniu/http";
import { markNotificationRead, type NotificationRow, toNotification } from "@/app/lib/miniu/notifications";
import { selectOne } from "@/app/lib/miniu/supabase";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const user = await requireUser();
    const notification = await selectOne<NotificationRow>("notifications", `id=eq.${id}&user_id=eq.${user.id}&deleted_at=is.null&limit=1&select=*`);
    if (!notification) {
      return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "알림을 찾을 수 없어요.", details: null } }, { status: 404 });
    }

    const readNotification = await markNotificationRead(notification, user.id);
    return ok({ notification: toNotification(readNotification) });
  } catch (error) {
    return fail(error);
  }
}
