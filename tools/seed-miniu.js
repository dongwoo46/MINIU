#!/usr/bin/env node
"use strict";

/**
 * MINIU 개발용 시드 스크립트.
 *
 * 테스트 계정 2개를 만들고 커플로 연결한 뒤, 기록/문자/미니유/인벤토리/알림 등
 * 새로 만든 화면을 눈으로 확인할 수 있을 만큼의 최소 데이터를 채운다.
 *
 * 실행 전 확인할 것:
 * - .env.local (또는 .env)에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY가 설정돼 있어야 한다.
 * - 이 스크립트는 **원격 Supabase 프로젝트에 실제로 데이터를 씁니다.** 반드시 개발용 프로젝트인지 확인 후 실행할 것.
 * - 생성되는 계정: miniu.seed.a@example.com / miniu.seed.b@example.com, 비밀번호는 아래 SEED_PASSWORD 참고.
 * - node tools/seed-miniu.js
 */

const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

// .env 먼저, .env.local이 있으면 그 값으로 덮어쓴다 (Next.js와 동일한 우선순위).
loadEnvFile(path.join(__dirname, "..", ".env"));
loadEnvFile(path.join(__dirname, "..", ".env.local"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 필요합니다. .env.local을 확인하세요.");
  process.exit(1);
}

const SEED_PASSWORD = "Miniu-Seed-2026!";
const SEED_USERS = [
  { email: "miniu.seed.a@example.com", name: "미니유시드A", birthDate: "1998-03-14" },
  { email: "miniu.seed.b@example.com", name: "미니유시드B", birthDate: "1999-07-02" },
];

async function supabaseRest(pathname, init = {}) {
  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}${pathname}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init.headers,
    },
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`Supabase 요청 실패 (${response.status} ${pathname}): ${text}`);
  }
  return payload;
}

async function createOrGetAuthUser(email, password, name) {
  try {
    const created = await supabaseRest("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      }),
    });
    return created.id;
  } catch (error) {
    if (String(error.message).includes("already been registered") || String(error.message).includes("already registered")) {
      const list = await supabaseRest(`/auth/v1/admin/users?email=${encodeURIComponent(email)}`);
      const existing = (list.users || list || []).find((user) => user.email === email);
      if (existing) {
        return existing.id;
      }
    }
    throw error;
  }
}

async function upsertProfile(userId, user) {
  const now = new Date().toISOString();
  await supabaseRest(`/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    body: JSON.stringify({
      email: user.email,
      name: user.name,
      birth_date: user.birthDate,
      email_verified_at: now,
      terms_agreed_at: now,
      required_consents_agreed_at: now,
      marketing_agreed_at: now,
      onboarding_step: "home",
    }),
  }).then(async (rows) => {
    if (Array.isArray(rows) && rows.length > 0) {
      return rows;
    }
    return supabaseRest("/rest/v1/profiles", {
      method: "POST",
      body: JSON.stringify({
        id: userId,
        email: user.email,
        name: user.name,
        birth_date: user.birthDate,
        email_verified_at: now,
        terms_agreed_at: now,
        required_consents_agreed_at: now,
        marketing_agreed_at: now,
        onboarding_step: "home",
      }),
    });
  });
}

async function ensureCouple(userIdA, userIdB) {
  const existing = await supabaseRest(`/rest/v1/couple_members?user_id=eq.${userIdA}&active=eq.true&select=couple_id`);
  if (Array.isArray(existing) && existing.length > 0) {
    return existing[0].couple_id;
  }
  const [couple] = await supabaseRest("/rest/v1/couples", {
    method: "POST",
    body: JSON.stringify({ status: "connected" }),
  });
  await supabaseRest("/rest/v1/couple_members", {
    method: "POST",
    body: JSON.stringify([
      { couple_id: couple.id, user_id: userIdA, partner_user_id: userIdB, active: true },
      { couple_id: couple.id, user_id: userIdB, partner_user_id: userIdA, active: true },
    ]),
  });
  return couple.id;
}

async function seedPreQuestionsAndCards(userId, relationshipStartedOn, answers) {
  await supabaseRest("/rest/v1/pre_question_sets", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, relationship_started_on: relationshipStartedOn }),
  }).catch(() => undefined); // 이미 있으면(유니크 제약) 무시

  const cards = await supabaseRest("/rest/v1/profile_cards", {
    method: "POST",
    body: JSON.stringify(
      Object.entries(answers).map(([category, content]) => ({ user_id: userId, category, content })),
    ),
  });
  return cards;
}

async function seedRecords(userId, entries) {
  return supabaseRest("/rest/v1/records", {
    method: "POST",
    body: JSON.stringify(entries.map((entry) => ({ user_id: userId, content: entry.content, happened_on: entry.happenedOn, analysis_status: "complete" }))),
  });
}

async function seedMiniu(userId, name, attrs) {
  const existing = await supabaseRest(`/rest/v1/minius?user_id=eq.${userId}&deleted_at=is.null&select=id`);
  if (Array.isArray(existing) && existing.length > 0) {
    return existing[0];
  }
  const [miniu] = await supabaseRest("/rest/v1/minius", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, name, ...attrs }),
  });
  return miniu;
}

async function seedInventory(userId, items) {
  return supabaseRest("/rest/v1/inventory_items", {
    method: "POST",
    body: JSON.stringify(items.map((item) => ({ user_id: userId, item_name: item.name, asset_key: item.assetKey, equipped: item.equipped }))),
  });
}

async function seedLetters(coupleId, senderId, recipientId, contents) {
  return supabaseRest("/rest/v1/letters", {
    method: "POST",
    body: JSON.stringify(contents.map((content) => ({ couple_id: coupleId, sender_id: senderId, recipient_id: recipientId, content }))),
  });
}

async function seedNotification(userId, coupleId, type, title, body) {
  return supabaseRest("/rest/v1/notifications", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, couple_id: coupleId, notification_type: type, title, body }),
  });
}

async function main() {
  console.log("MINIU 시드 시작...");

  const [userA, userB] = await Promise.all(
    SEED_USERS.map(async (user) => ({ ...user, id: await createOrGetAuthUser(user.email, SEED_PASSWORD, user.name) })),
  );
  console.log(`계정 준비: ${userA.email} (${userA.id}), ${userB.email} (${userB.id})`);

  await Promise.all([upsertProfile(userA.id, userA), upsertProfile(userB.id, userB)]);

  const coupleId = await ensureCouple(userA.id, userB.id);
  console.log(`커플 연결: ${coupleId}`);

  await seedPreQuestionsAndCards(userA.id, "2023-05-14", {
    likes: "아이스 아메리카노, 산책",
    dislikes: "갑작스러운 일정 변경",
    values: "약속을 지키는 것",
    habits: "자기 전에 음악 듣기",
    tendencies: "낯가림이 있지만 친해지면 장난이 많음",
  });
  await seedPreQuestionsAndCards(userB.id, "2023-05-14", {
    likes: "고양이, 파스타",
    dislikes: "시끄러운 곳",
    values: "솔직함",
    habits: "주말 아침 러닝",
    tendencies: "계획적이고 꼼꼼함",
  });
  console.log("사전 질문 · 프로필 카드 시드 완료");

  await seedRecords(userA.id, [
    { content: "오늘 아이스 아메리카노 세 잔 마셨대", happenedOn: "2026-09-01" },
    { content: "주말에 같이 산책하고 싶다고 함", happenedOn: "2026-09-05" },
  ]);
  await seedRecords(userB.id, [
    { content: "고양이 카페 가고 싶다고 함", happenedOn: "2026-09-02" },
  ]);
  console.log("기록 시드 완료");

  await seedMiniu(userA.id, "모카", { preset: "basic", hair_style: "short", hair_color: "brown", skin_tone: "warm", face_shape: "round", expression: "smile" });
  const miniuB = await seedMiniu(userB.id, "라떼", { preset: "cute", hair_style: "long", hair_color: "black", skin_tone: "fair", face_shape: "oval", expression: "wink" });
  console.log("미니유 시드 완료");

  await seedInventory(userB.id, [{ name: "테이크아웃 커피 컵", assetKey: "item-coffee-cup", equipped: true }]);
  console.log("인벤토리 시드 완료");

  await seedLetters(coupleId, userA.id, userB.id, ["오늘도 좋은 하루 보내!", "산책 가고 싶다 ㅎㅎ"]);
  await seedLetters(coupleId, userB.id, userA.id, ["나도 보고싶어 ㅠㅠ"]);
  console.log("문자 시드 완료");

  await seedNotification(userB.id, coupleId, "couple_connected", "커플 연결이 완료됐어요.", null);
  await seedNotification(userA.id, coupleId, "letter_received", "문자가 도착했어요.", "나도 보고싶어 ㅠㅠ");
  console.log("알림 시드 완료");

  console.log("\n완료. 아래 계정으로 로그인해서 확인하세요:");
  console.log(`  ${userA.email} / ${SEED_PASSWORD}`);
  console.log(`  ${userB.email} / ${SEED_PASSWORD}`);
  console.log(`  (참고용 미니유B id: ${miniuB.id})`);
}

main().catch((error) => {
  console.error("시드 실패:", error);
  process.exit(1);
});
