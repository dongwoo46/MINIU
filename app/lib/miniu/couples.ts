import { selectOne } from "./supabase";
import type { Couple } from "./types";

export type CoupleMemberRow = {
  couple_id: string;
  user_id: string;
  partner_user_id: string;
  active: boolean;
  joined_at: string;
};

export type CoupleRow = {
  id: string;
  status: "connected" | "unlink_pending";
  connected_at: string;
  unlink_requested_at: string | null;
  purge_after: string | null;
};

export async function getSupabaseConnectedCouple(userId: string): Promise<Couple | null> {
  const member = await selectOne<CoupleMemberRow>(
    "couple_members",
    `user_id=eq.${userId}&active=eq.true&order=joined_at.desc&limit=1&select=*`,
  );
  if (!member) {
    return null;
  }

  const couple = await selectOne<CoupleRow>(
    "couples",
    `id=eq.${member.couple_id}&status=eq.connected&purge_after=is.null&select=*`,
  );
  if (!couple) {
    return null;
  }

  return {
    id: couple.id,
    userIds: [member.user_id, member.partner_user_id],
    status: "connected",
    connectedAt: couple.connected_at,
    unlinkRequestedAt: couple.unlink_requested_at,
    purgeAfter: couple.purge_after,
  };
}

export function normalizeInvitationCode(code: string): string {
  return code.trim().replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}
