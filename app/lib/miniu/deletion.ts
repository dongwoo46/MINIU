import type { Couple } from "./types";
import { logSupabaseEvent } from "./events";
import { patchRows, selectRows } from "./supabase";

export const deletionGraceMs = 1000 * 60 * 60 * 24 * 30;

export function deletionWindow(now = new Date()): { deletedAt: string; purgeAfter: string } {
  return {
    deletedAt: now.toISOString(),
    purgeAfter: new Date(now.getTime() + deletionGraceMs).toISOString(),
  };
}

export async function softDeleteUserRows(table: string, userIdList: string, deletedAt: string, purgeAfter: string): Promise<void> {
  await patchRows(table, `user_id=in.(${userIdList})&deleted_at=is.null`, {
    deleted_at: deletedAt,
    purge_after: purgeAfter,
  });
}

export async function softDeleteCoupleRows(table: string, coupleId: string, deletedAt: string, purgeAfter: string): Promise<void> {
  await patchRows(table, `couple_id=eq.${coupleId}&deleted_at=is.null`, {
    deleted_at: deletedAt,
    purge_after: purgeAfter,
  });
}

export async function softDeleteLettersForCouple(coupleId: string, deletedAt: string, purgeAfter: string): Promise<void> {
  const letters = await selectRows<{ id: string }>("letters", `couple_id=eq.${coupleId}&deleted_at=is.null&select=id`);
  if (letters.length > 0) {
    await patchRows("letter_attachments", `letter_id=in.(${letters.map((letter) => letter.id).join(",")})&deleted_at=is.null`, {
      deleted_at: deletedAt,
      purge_after: purgeAfter,
    });
  }
  await softDeleteCoupleRows("letters", coupleId, deletedAt, purgeAfter);
}

export async function softDeletePersonalData(userIdList: string, deletedAt: string, purgeAfter: string): Promise<void> {
  await softDeleteUserRows("pre_question_answers", userIdList, deletedAt, purgeAfter);
  await softDeleteUserRows("pre_question_sets", userIdList, deletedAt, purgeAfter);
  await softDeleteUserRows("minius", userIdList, deletedAt, purgeAfter);
  await softDeleteUserRows("records", userIdList, deletedAt, purgeAfter);
  await softDeleteUserRows("profile_cards", userIdList, deletedAt, purgeAfter);
  await softDeleteUserRows("tone_profiles", userIdList, deletedAt, purgeAfter);
  await softDeleteUserRows("chat_messages", userIdList, deletedAt, purgeAfter);
  await softDeleteUserRows("item_suggestions", userIdList, deletedAt, purgeAfter);
  await softDeleteUserRows("inventory_items", userIdList, deletedAt, purgeAfter);
}

export async function unlinkCoupleForDeletion(params: {
  couple: Couple;
  requestedByUserId: string;
  deletedAt: string;
  purgeAfter: string;
  eventName: string;
}): Promise<void> {
  const userIdList = params.couple.userIds.join(",");

  await patchRows("couples", `id=eq.${params.couple.id}&status=eq.connected`, {
    status: "unlink_pending",
    unlink_requested_by: params.requestedByUserId,
    unlink_requested_at: params.deletedAt,
    purge_after: params.purgeAfter,
  });
  await patchRows("couple_members", `couple_id=eq.${params.couple.id}&active=eq.true`, {
    active: false,
    left_at: params.deletedAt,
  });
  await patchRows("profiles", `id=in.(${userIdList})`, {
    onboarding_step: "couple_link",
  });
  await patchRows("invitations", `created_by=in.(${userIdList})&status=eq.pending`, {
    status: "expired",
  });

  await softDeletePersonalData(userIdList, params.deletedAt, params.purgeAfter);
  await softDeleteCoupleRows("affection_activities", params.couple.id, params.deletedAt, params.purgeAfter);
  await softDeleteCoupleRows("notifications", params.couple.id, params.deletedAt, params.purgeAfter);
  await softDeleteLettersForCouple(params.couple.id, params.deletedAt, params.purgeAfter);

  await Promise.all(
    params.couple.userIds.map((targetUserId) =>
      logSupabaseEvent({
        userId: targetUserId,
        coupleId: params.couple.id,
        name: params.eventName,
        metadata: { purgeAfter: params.purgeAfter },
      }),
    ),
  );
}
