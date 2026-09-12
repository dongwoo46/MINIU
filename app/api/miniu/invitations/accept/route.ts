import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple, normalizeInvitationCode } from "@/app/lib/miniu/couples";
import { logSupabaseEvent } from "@/app/lib/miniu/events";
import { fail, ok } from "@/app/lib/miniu/http";
import { createNotification } from "@/app/lib/miniu/notifications";
import { insertRows, patchRows, selectOne } from "@/app/lib/miniu/supabase";
import { assertObject, stringField } from "@/app/lib/miniu/validation";

type InvitationRow = {
  id: string;
  created_by: string;
  code: string;
  status: "pending" | "accepted" | "expired";
  expires_at: string;
  accepted_by: string | null;
  accepted_at: string | null;
  created_at: string;
};

type CoupleRow = {
  id: string;
  status: "connected" | "unlink_pending";
  connected_at: string;
  unlink_requested_at: string | null;
  purge_after: string | null;
};

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const code = normalizeInvitationCode(stringField(body, "code"));

    const user = await requireUser();
    let status:
      | "accepted"
      | "already_connected"
      | "not_found"
      | "own_code"
      | "expired"
      | "creator_connected" = "accepted";
    let couple = null;

    if (await getSupabaseConnectedCouple(user.id)) {
      status = "already_connected";
    }

    const invitation =
      status === "accepted"
        ? await selectOne<InvitationRow>("invitations", `code=eq.${code}&select=*`)
        : null;

    if (status === "accepted" && !invitation) {
      status = "not_found";
    }
    if (status === "accepted" && invitation?.created_by === user.id) {
      status = "own_code";
    }
    if (status === "accepted" && invitation && (invitation.status !== "pending" || Date.parse(invitation.expires_at) <= Date.now())) {
      await patchRows("invitations", `id=eq.${invitation.id}&status=eq.pending`, {
        status: "expired",
      });
      status = "expired";
    }
    if (status === "accepted" && invitation && (await getSupabaseConnectedCouple(invitation.created_by))) {
      await patchRows("invitations", `id=eq.${invitation.id}&status=eq.pending`, {
        status: "expired",
      });
      status = "creator_connected";
    }

    if (status === "accepted" && invitation) {
      const now = new Date().toISOString();
      const [createdCouple] = await insertRows<CoupleRow>("couples", {});
      await insertRows("couple_members", [
        {
          couple_id: createdCouple.id,
          user_id: invitation.created_by,
          partner_user_id: user.id,
        },
        {
          couple_id: createdCouple.id,
          user_id: user.id,
          partner_user_id: invitation.created_by,
        },
      ]);
      await patchRows("invitations", `id=eq.${invitation.id}`, {
        status: "accepted",
        accepted_by: user.id,
        accepted_at: now,
      });
      await patchRows("invitations", `created_by=eq.${user.id}&status=eq.pending`, {
        status: "expired",
      });
      await patchRows("profiles", `id=in.(${invitation.created_by},${user.id})&onboarding_step=eq.couple_link`, {
        onboarding_step: "pre_questions",
      });
      await Promise.all([
        createNotification({
          userId: user.id,
          coupleId: createdCouple.id,
          type: "couple_connected",
          title: "커플 연결이 완료됐어요",
          body: "이제 연결된 기능을 사용할 수 있어요.",
        }),
        createNotification({
          userId: invitation.created_by,
          coupleId: createdCouple.id,
          type: "couple_connected",
          title: "커플 연결이 완료됐어요",
          body: "이제 연결된 기능을 사용할 수 있어요.",
        }),
      ]);
      await logSupabaseEvent({ userId: user.id, coupleId: createdCouple.id, name: "couple_connected", metadata: { role: "acceptor" } });
      await logSupabaseEvent({ userId: invitation.created_by, coupleId: createdCouple.id, name: "couple_connected", metadata: { role: "creator" } });
      couple = {
        id: createdCouple.id,
        userIds: [invitation.created_by, user.id] as [string, string],
        status: "connected" as const,
        connectedAt: createdCouple.connected_at,
        unlinkRequestedAt: createdCouple.unlink_requested_at,
        purgeAfter: createdCouple.purge_after,
      };
    }

    if (status !== "accepted") {
      const messages: Record<typeof status, string> = {
        already_connected: "이미 연인과 연결되어 있어요.",
        not_found: "초대 코드를 찾을 수 없어요.",
        own_code: "내 초대 코드는 사용할 수 없어요.",
        expired: "만료되었거나 이미 사용된 코드예요.",
        creator_connected: "초대한 사용자가 이미 연결되어 있어요.",
      };
      return Response.json({ ok: false, error: { code: "CONFLICT", message: messages[status], details: null } }, { status: 409 });
    }

    return ok({ couple });
  } catch (error) {
    return fail(error);
  }
}
