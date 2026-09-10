import { requireCouple, requireUser } from "@/app/lib/miniu/auth";
import { logEvent } from "@/app/lib/miniu/facts";
import { fail, ok } from "@/app/lib/miniu/http";
import { updateDb } from "@/app/lib/miniu/store";
import { assertObject, booleanField } from "@/app/lib/miniu/validation";

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const confirmed = booleanField(body, "confirmed");
    if (!confirmed) {
      return Response.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "Unlink confirmation is required.", details: { confirmed: "required" } } },
        { status: 400 },
      );
    }

    const result = await updateDb(async (db) => {
      const user = await requireUser(db);
      const couple = requireCouple(db, user.id);
      const now = new Date();
      const purgeAfter = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30).toISOString();
      couple.status = "unlinkPending";
      couple.unlinkRequestedAt = now.toISOString();
      couple.purgeAfter = purgeAfter;

      for (const userId of couple.userIds) {
        db.preQuestions = db.preQuestions.filter((item) => item.userId !== userId);
        db.minius = db.minius.filter((item) => item.userId !== userId);
        db.records = db.records.filter((item) => item.userId !== userId);
        db.profileCards = db.profileCards.filter((item) => item.userId !== userId);
        const account = db.users.find((item) => item.id === userId);
        if (account) {
          account.onboardingStep = "coupleLink";
        }
        logEvent(db, { userId, coupleId: couple.id, name: "couple_unlink_requested", metadata: { purgeAfter } });
      }

      for (const invitation of db.invitations) {
        if (couple.userIds.includes(invitation.createdByUserId) && invitation.status === "pending") {
          invitation.status = "expired";
        }
      }

      return { coupleId: couple.id, purgeAfter };
    });

    return ok(result);
  } catch (error) {
    return fail(error);
  }
}
