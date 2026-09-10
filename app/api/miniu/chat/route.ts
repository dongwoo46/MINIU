import { requireCouple, requireUser } from "@/app/lib/miniu/auth";
import { getKstDate, getNextKstMidnight, logEvent } from "@/app/lib/miniu/facts";
import { generateGeminiText } from "@/app/lib/miniu/gemini";
import { fail, ok } from "@/app/lib/miniu/http";
import { getDb, updateDb } from "@/app/lib/miniu/store";
import { assertObject, stringField } from "@/app/lib/miniu/validation";

const dailyLimit = 20;

function buildPrompt(input: { message: string; cards: string[]; records: string[]; miniuName: string | null }) {
  return [
    "너는 MINIU 서비스의 연인 미니유 AI 채팅 응답기다.",
    "한국어로 다정하지만 과장 없이 답한다.",
    "사용자가 직접 기록한 프로필 카드와 기록만 근거로 삼고, 모르는 사실은 지어내지 않는다.",
    input.miniuName ? `미니유 이름: ${input.miniuName}` : "미니유 이름: 미설정",
    `프로필 카드:\n${input.cards.length ? input.cards.join("\n") : "- 없음"}`,
    `최근 기록:\n${input.records.length ? input.records.join("\n") : "- 없음"}`,
    `사용자 메시지: ${input.message}`,
  ].join("\n\n");
}

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const message = stringField(body, "message");

    const db = await getDb();
    const user = await requireUser(db);
    const couple = requireCouple(db, user.id);
    const kstDate = getKstDate();
    const usage = db.chatUsages.find((item) => item.userId === user.id && item.kstDate === kstDate);
    const used = usage?.used ?? 0;
    if (used >= dailyLimit) {
      return Response.json(
        { ok: false, error: { code: "RATE_LIMITED", message: "Daily chat limit reached.", details: { resetsAt: getNextKstMidnight() } } },
        { status: 429 },
      );
    }

    const miniu = db.minius.find((item) => item.userId === user.id) ?? null;
    const cards = db.profileCards
      .filter((card) => card.userId === user.id)
      .slice(0, 30)
      .map((card) => `- ${card.category}: ${card.content}`);
    const records = db.records
      .filter((record) => record.userId === user.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 10)
      .map((record) => `- ${record.content}`);

    const prompt = buildPrompt({ message, cards, records, miniuName: miniu?.name ?? null });
    const generated = await generateGeminiText(prompt);
    const reply = generated ?? "아직 AI 키가 연결되지 않아 임시 답변으로 응답해요. 기록된 카드와 최근 기록을 바탕으로 답변하도록 준비되어 있어요.";

    const result = await updateDb(async (latestDb) => {
      const latestUser = await requireUser(latestDb);
      requireCouple(latestDb, latestUser.id);
      const latestKstDate = getKstDate();
      const latestUsage =
        latestDb.chatUsages.find((item) => item.userId === latestUser.id && item.kstDate === latestKstDate) ??
        (() => {
          const created = { userId: latestUser.id, kstDate: latestKstDate, used: 0 };
          latestDb.chatUsages.push(created);
          return created;
        })();
      latestUsage.used += 1;
      logEvent(latestDb, { userId: latestUser.id, coupleId: couple.id, name: "ai_chat_completed" });
      return { used: latestUsage.used };
    });

    return ok({ reply, usage: { limit: dailyLimit, used: result.used, remaining: dailyLimit - result.used, resetsAt: getNextKstMidnight() } });
  } catch (error) {
    return fail(error);
  }
}
