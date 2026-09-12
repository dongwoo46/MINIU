import { publicUser, requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { fail, ok } from "@/app/lib/miniu/http";
import { type MiniuRow, toMiniu } from "@/app/lib/miniu/minius";
import { selectOne, selectRows } from "@/app/lib/miniu/supabase";

type PreQuestionSetRow = {
  id: string;
};

type UnreadLetterRow = {
  id: string;
};

type UnreadNotificationRow = {
  id: string;
};

export async function GET() {
  try {
    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    const miniu = await selectOne<MiniuRow>("minius", `user_id=eq.${user.id}&deleted_at=is.null&limit=1&select=*`);
    const preQuestions = await selectOne<PreQuestionSetRow>("pre_question_sets", `user_id=eq.${user.id}&deleted_at=is.null&limit=1&select=id`);
    const unreadLetters = couple
      ? await selectRows<UnreadLetterRow>("letters", `couple_id=eq.${couple.id}&recipient_id=eq.${user.id}&read_at=is.null&deleted_at=is.null&select=id`)
      : [];
    const unreadNotifications = await selectRows<UnreadNotificationRow>(
      "notifications",
      `user_id=eq.${user.id}&read_at=is.null&deleted_at=is.null&select=id`,
    );

    return ok({
      user: publicUser(user),
      couple,
      miniu: miniu ? toMiniu(miniu) : null,
      unreadLetterCount: unreadLetters.length,
      unreadNotificationCount: unreadNotifications.length,
      onboarding: {
        needsPreQuestions: !preQuestions,
        isComplete: user.onboardingStep === "home",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
