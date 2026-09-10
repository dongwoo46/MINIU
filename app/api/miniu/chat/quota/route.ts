import { requireCouple, requireUser } from "@/app/lib/miniu/auth";
import { getKstDate, getNextKstMidnight } from "@/app/lib/miniu/facts";
import { fail, ok } from "@/app/lib/miniu/http";
import { getDb } from "@/app/lib/miniu/store";

const dailyLimit = 20;

export async function GET() {
  try {
    const db = await getDb();
    const user = await requireUser(db);
    requireCouple(db, user.id);
    const kstDate = getKstDate();
    const usage = db.chatUsages.find((item) => item.userId === user.id && item.kstDate === kstDate);
    const used = usage?.used ?? 0;
    return ok({ limit: dailyLimit, used, remaining: Math.max(0, dailyLimit - used), resetsAt: getNextKstMidnight() });
  } catch (error) {
    return fail(error);
  }
}
