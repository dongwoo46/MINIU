import { publicUser, requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { fail, ok } from "@/app/lib/miniu/http";
import { type MiniuRow, toMiniu } from "@/app/lib/miniu/minius";
import { selectOne } from "@/app/lib/miniu/supabase";

type PreQuestionSetRow = {
  id: string;
};

export async function GET() {
  try {
    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    const miniu = await selectOne<MiniuRow>("minius", `user_id=eq.${user.id}&deleted_at=is.null&limit=1&select=*`);
    const preQuestions = await selectOne<PreQuestionSetRow>("pre_question_sets", `user_id=eq.${user.id}&deleted_at=is.null&limit=1&select=id`);

    return ok({
      user: publicUser(user),
      couple,
      miniu: miniu ? toMiniu(miniu) : null,
      onboarding: {
        needsPreQuestions: !preQuestions,
        isComplete: user.onboardingStep === "home",
      },
    });
  } catch (error) {
    return fail(error);
  }
}
