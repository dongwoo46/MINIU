import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { createInviteCode } from "@/app/lib/miniu/crypto";
import { fail, ok } from "@/app/lib/miniu/http";
import { insertRows, patchRows, selectOne } from "@/app/lib/miniu/supabase";

const inviteTtlMs = 1000 * 60 * 60 * 24 * 7;

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

function buildInviteLink(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/connect?code=${code}`;
}

function publicInvitation(row: InvitationRow) {
  return {
    id: row.id,
    codePreview: row.code,
    link: buildInviteLink(row.code),
    createdByUserId: row.created_by,
    status: row.status,
    expiresAt: row.expires_at,
    acceptedByUserId: row.accepted_by,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    const invitation = await selectOne<InvitationRow>(
      "invitations",
      `created_by=eq.${user.id}&status=eq.pending&order=created_at.desc&limit=1&select=*`,
    );
    if (invitation && Date.parse(invitation.expires_at) <= Date.now()) {
      await patchRows("invitations", `id=eq.${invitation.id}&status=eq.pending`, {
        status: "expired",
      });
      return ok({ invitation: null });
    }

    return ok({ invitation: invitation ? publicInvitation(invitation) : null });
  } catch (error) {
    return fail(error);
  }
}

export async function POST() {
  try {
    const user = await requireUser();
    if (await getSupabaseConnectedCouple(user.id)) {
      return Response.json({ ok: false, error: { code: "CONFLICT", message: "이미 연인과 연결되어 있어요.", details: null } }, { status: 409 });
    }

    await patchRows("invitations", `created_by=eq.${user.id}&status=eq.pending`, {
      status: "expired",
    });

    const code = createInviteCode();
    const expiresAt = new Date(Date.now() + inviteTtlMs).toISOString();
    const [invitation] = await insertRows<InvitationRow>("invitations", {
      created_by: user.id,
      code,
      expires_at: expiresAt,
    });

    return ok({ invitation: publicInvitation(invitation), code, link: buildInviteLink(code) });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH() {
  try {
    const user = await requireUser();
    if (user.onboardingStep === "coupleLink") {
      await patchRows("profiles", `id=eq.${user.id}`, {
        onboarding_step: "pre_questions",
      });
    }
    return ok({ nextStep: "preQuestions" });
  } catch (error) {
    return fail(error);
  }
}
