import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { fail, ok } from "@/app/lib/miniu/http";
import { addProfileCardsFromTextSupabase } from "@/app/lib/miniu/profile-cards";
import { type RecordRow, toRecordEntry } from "@/app/lib/miniu/records";
import { patchRows, selectOne, selectRows } from "@/app/lib/miniu/supabase";
import { ApiError } from "@/app/lib/miniu/validation";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const user = await requireUser();
    if (!(await getSupabaseConnectedCouple(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }
    const record = await selectOne<RecordRow>("records", `id=eq.${id}&user_id=eq.${user.id}&deleted_at=is.null&select=*`);
    if (!record) {
      return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "기록을 찾을 수 없어요.", details: null } }, { status: 404 });
    }
    if (record.analysis_status !== "failed_temporary") {
      return Response.json({ ok: false, error: { code: "CONFLICT", message: "다시 분석할 수 없는 기록이에요.", details: null } }, { status: 409 });
    }

    const now = new Date().toISOString();
    const recordSources = await selectRows<{ card_id: string }>(
      "profile_card_sources",
      `user_id=eq.${user.id}&source_type=eq.record&source_id=eq.${id}&select=card_id`,
    );
    const cardIds = [...new Set(recordSources.map((source) => source.card_id))];
    await Promise.all(cardIds.map((cardId) => patchRows("profile_cards", `id=eq.${cardId}&user_id=eq.${user.id}&deleted_at=is.null`, { deleted_at: now })));

    const cardCount = await addProfileCardsFromTextSupabase(user.id, record.content, { type: "record", id: record.id });
    const [updatedRecord] = await patchRows<RecordRow>("records", `id=eq.${record.id}&user_id=eq.${user.id}`, {
      analysis_status: "complete",
      analysis_error: null,
    });

    return ok({ record: toRecordEntry(updatedRecord), cardCount });
  } catch (error) {
    return fail(error);
  }
}
