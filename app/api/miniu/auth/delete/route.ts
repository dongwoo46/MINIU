import { clearSessionCookie, requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { deletionWindow, softDeletePersonalData, unlinkCoupleForDeletion } from "@/app/lib/miniu/deletion";
import { logSupabaseEvent } from "@/app/lib/miniu/events";
import { fail, ok } from "@/app/lib/miniu/http";
import { patchRows } from "@/app/lib/miniu/supabase";
import { assertObject, booleanField } from "@/app/lib/miniu/validation";

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const confirmed = booleanField(body, "confirmed");
    if (!confirmed) {
      return Response.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "삭제 확인이 필요해요.", details: { confirmed: "required" } } },
        { status: 400 },
      );
    }

    const user = await requireUser();
    const { deletedAt, purgeAfter } = deletionWindow();
    const couple = await getSupabaseConnectedCouple(user.id);

    if (couple) {
      await unlinkCoupleForDeletion({
        couple,
        requestedByUserId: user.id,
        deletedAt,
        purgeAfter,
        eventName: "account_delete_requested",
      });
    } else {
      await patchRows("invitations", `created_by=eq.${user.id}&status=eq.pending`, {
        status: "expired",
      });
      await softDeletePersonalData(user.id, deletedAt, purgeAfter);
      await logSupabaseEvent({ userId: user.id, name: "account_delete_requested", metadata: { purgeAfter } });
    }

    await patchRows("profiles", `id=eq.${user.id}&deleted_at=is.null`, {
      deleted_at: deletedAt,
      purge_after: purgeAfter,
    });
    await patchRows("app_sessions", `user_id=eq.${user.id}&revoked_at=is.null`, {
      revoked_at: deletedAt,
    });
    await clearSessionCookie();

    return ok({ deleted: true, purgeAfter });
  } catch (error) {
    return fail(error);
  }
}
