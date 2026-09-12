import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { logSupabaseEvent } from "@/app/lib/miniu/events";
import { fail, ok } from "@/app/lib/miniu/http";
import { type InventoryItemRow, toInventoryItem } from "@/app/lib/miniu/inventory";
import { type MiniuRow, toMiniu } from "@/app/lib/miniu/minius";
import { selectOne, selectRows } from "@/app/lib/miniu/supabase";
import { ApiError } from "@/app/lib/miniu/validation";

type PreQuestionSetRow = {
  relationship_started_on: string;
};

export async function GET() {
  try {
    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    if (!couple) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const [miniu, equippedItems, preQuestions] = await Promise.all([
      selectOne<MiniuRow>("minius", `user_id=eq.${user.id}&deleted_at=is.null&limit=1&select=*`),
      selectRows<InventoryItemRow>("inventory_items", `user_id=eq.${user.id}&equipped=eq.true&deleted_at=is.null&order=created_at.desc&select=*`),
      selectOne<PreQuestionSetRow>("pre_question_sets", `user_id=eq.${user.id}&deleted_at=is.null&order=created_at.desc&limit=1&select=relationship_started_on`),
    ]);
    if (!miniu) {
      throw new ApiError(404, "NOT_FOUND", "미니유를 먼저 만들어 주세요.");
    }

    await logSupabaseEvent({ userId: user.id, coupleId: couple.id, name: "share_scene_viewed" });

    return ok({
      scene: {
        backgroundKey: "default-room",
        miniu: toMiniu(miniu),
        equippedItems: equippedItems.map(toInventoryItem),
        dDay: preQuestions
          ? {
              relationshipStartedOn: preQuestions.relationship_started_on,
              daysTogether: daysTogether(preQuestions.relationship_started_on),
              defaultVisible: false,
            }
          : null,
        privacy: {
          includesRealName: false,
          includesLetterContent: false,
          includesRecordContent: false,
        },
      },
    });
  } catch (error) {
    return fail(error);
  }
}

function daysTogether(startedOn: string, now = new Date()): number {
  const start = new Date(`${startedOn}T00:00:00.000Z`);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1);
}
