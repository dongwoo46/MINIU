import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { getKstDate, getNextKstMidnight } from "@/app/lib/miniu/facts";
import { fail, ok } from "@/app/lib/miniu/http";
import { selectOne } from "@/app/lib/miniu/supabase";
import { ApiError } from "@/app/lib/miniu/validation";

const dailyLimit = 20;

type ChatUsageRow = {
  user_id: string;
  kst_date: string;
  used_count: number;
};

export async function GET() {
  try {
    const user = await requireUser();
    if (!(await getSupabaseConnectedCouple(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }
    const kstDate = getKstDate();
    const usage = await selectOne<ChatUsageRow>("chat_daily_usage", `user_id=eq.${user.id}&kst_date=eq.${kstDate}&select=*`);
    const used = usage?.used_count ?? 0;
    return ok({ limit: dailyLimit, used, remaining: Math.max(0, dailyLimit - used), resetsAt: getNextKstMidnight() });
  } catch (error) {
    return fail(error);
  }
}
