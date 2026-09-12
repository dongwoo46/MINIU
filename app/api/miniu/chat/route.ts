import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { logSupabaseEvent } from "@/app/lib/miniu/events";
import { getKstDate, getNextKstMidnight } from "@/app/lib/miniu/facts";
import { generateGeminiText } from "@/app/lib/miniu/gemini";
import { fail, ok } from "@/app/lib/miniu/http";
import { type MiniuRow, toMiniu } from "@/app/lib/miniu/minius";
import { type ProfileCardRow } from "@/app/lib/miniu/profile-cards";
import { type RecordRow } from "@/app/lib/miniu/records";
import { insertRows, patchRows, selectOne, selectRows } from "@/app/lib/miniu/supabase";
import { ApiError, assertObject, stringField } from "@/app/lib/miniu/validation";

const dailyLimit = 20;

type ChatUsageRow = {
  user_id: string;
  kst_date: string;
  used_count: number;
};

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

    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    if (!couple) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const kstDate = getKstDate();
    const usage = await selectOne<ChatUsageRow>("chat_daily_usage", `user_id=eq.${user.id}&kst_date=eq.${kstDate}&select=*`);
    const used = usage?.used_count ?? 0;
    if (used >= dailyLimit) {
      return Response.json(
        { ok: false, error: { code: "RATE_LIMITED", message: "오늘 채팅 횟수를 모두 사용했어요.", details: { resetsAt: getNextKstMidnight() } } },
        { status: 429 },
      );
    }

    const miniu = await selectOne<MiniuRow>("minius", `user_id=eq.${user.id}&deleted_at=is.null&limit=1&select=*`);
    const cards = (
      await selectRows<ProfileCardRow>("profile_cards", `user_id=eq.${user.id}&deleted_at=is.null&order=updated_at.desc&limit=30&select=*`)
    )
      .map((card) => `- ${card.category}: ${card.content}`);
    const records = (
      await selectRows<RecordRow>("records", `user_id=eq.${user.id}&deleted_at=is.null&order=created_at.desc&limit=10&select=*`)
    )
      .map((record) => `- ${record.content}`);

    const prompt = buildPrompt({ message, cards, records, miniuName: miniu ? toMiniu(miniu).name : null });
    const generated = await generateGeminiText(prompt);
    const reply = generated ?? "아직 AI 키가 연결되지 않아 임시 답변으로 응답해요. 기록된 카드와 최근 기록을 바탕으로 답변하도록 준비되어 있어요.";
    const nextUsed = used + 1;

    if (usage) {
      await patchRows("chat_daily_usage", `user_id=eq.${user.id}&kst_date=eq.${kstDate}`, {
        used_count: nextUsed,
      });
    } else {
      await insertRows("chat_daily_usage", {
        user_id: user.id,
        kst_date: kstDate,
        used_count: nextUsed,
      });
    }
    await insertRows("chat_messages", [
      {
        user_id: user.id,
        role: "user",
        content: message,
      },
      {
        user_id: user.id,
        role: "assistant",
        content: reply,
      },
    ]);
    await logSupabaseEvent({ userId: user.id, coupleId: couple.id, name: "ai_chat_completed" });

    return ok({ reply, usage: { limit: dailyLimit, used: nextUsed, remaining: dailyLimit - nextUsed, resetsAt: getNextKstMidnight() } });
  } catch (error) {
    return fail(error);
  }
}
