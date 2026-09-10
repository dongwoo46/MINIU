import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { fail, ok } from "@/app/lib/miniu/http";
import { type RecordRow } from "@/app/lib/miniu/records";
import { patchRows, selectOne, selectRows } from "@/app/lib/miniu/supabase";
import { ApiError } from "@/app/lib/miniu/validation";

type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const user = await requireUser();
    if (!(await getSupabaseConnectedCouple(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "Couple connection is required.");
    }
    const record = await selectOne<RecordRow>("records", `id=eq.${id}&user_id=eq.${user.id}&deleted_at=is.null&select=*`);
    if (!record) {
      return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "Record was not found.", details: null } }, { status: 404 });
    }

    const now = new Date().toISOString();
    await patchRows("records", `id=eq.${id}&user_id=eq.${user.id}&deleted_at=is.null`, { deleted_at: now });
    const recordSources = await selectRows<{ card_id: string }>(
      "profile_card_sources",
      `user_id=eq.${user.id}&source_type=eq.record&source_id=eq.${id}&select=card_id`,
    );
    const cardIds = [...new Set(recordSources.map((source) => source.card_id))];
    await Promise.all(cardIds.map((cardId) => patchRows("profile_cards", `id=eq.${cardId}&user_id=eq.${user.id}&deleted_at=is.null`, { deleted_at: now })));

    return ok({ deletedRecordId: id });
  } catch (error) {
    return fail(error);
  }
}
