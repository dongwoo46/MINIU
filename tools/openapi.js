#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.dirname(__dirname);
const API_ROOT = path.join(ROOT, "app", "api");
const FEATURE_DIR = path.join(ROOT, "docs", "features", "miniu");
const OUTPUT = path.join(FEATURE_DIR, "openapi.json");
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const publicOperations = new Set([
  "POST /api/miniu/auth/signup",
  "POST /api/miniu/auth/login",
  "POST /api/miniu/auth/verify",
  "POST /api/miniu/auth/resend-verification",
]);

const operationSummaries = {
  "GET /api/miniu/me": "현재 사용자 상태 조회",
  "POST /api/miniu/auth/signup": "회원가입",
  "POST /api/miniu/auth/login": "로그인",
  "POST /api/miniu/auth/logout": "로그아웃",
  "POST /api/miniu/auth/verify": "이메일 인증",
  "POST /api/miniu/auth/resend-verification": "인증 메일 재발송",
  "POST /api/miniu/auth/delete": "계정 삭제 요청",
  "GET /api/miniu/invitations": "초대 코드 조회",
  "POST /api/miniu/invitations": "초대 코드 생성",
  "POST /api/miniu/invitations/accept": "초대 코드 수락",
  "POST /api/miniu/couple/unlink": "커플 연결 해제",
  "POST /api/miniu/onboarding/pre-questions": "사전 질문 저장",
  "GET /api/miniu/miniu": "미니유 조회",
  "POST /api/miniu/miniu": "미니유 생성",
  "PATCH /api/miniu/miniu": "미니유 수정",
  "GET /api/miniu/records": "기록 목록 조회",
  "POST /api/miniu/records": "기록 생성",
  "DELETE /api/miniu/records/{id}": "기록 삭제",
  "POST /api/miniu/records/{id}/retry-analysis": "기록 분석 재시도",
  "GET /api/miniu/profile-cards": "프로필 카드 목록 조회",
  "GET /api/miniu/profile-cards/merge-candidates": "프로필 카드 병합 후보 조회",
  "POST /api/miniu/profile-cards/merge-candidates/{id}/reject": "프로필 카드 병합 후보 거절",
  "PATCH /api/miniu/profile-cards/{id}": "프로필 카드 수정",
  "DELETE /api/miniu/profile-cards/{id}": "프로필 카드 삭제",
  "POST /api/miniu/profile-cards/{id}/merge": "프로필 카드 병합",
  "GET /api/miniu/letters": "문자 목록 조회",
  "POST /api/miniu/letters": "문자 발송",
  "POST /api/miniu/letters/attachments": "문자 첨부 업로드",
  "GET /api/miniu/letters/{id}": "문자 상세 조회",
  "PATCH /api/miniu/letters/{id}/read": "문자 읽음 처리",
  "GET /api/miniu/letters/{id}/share-card": "문자 공유 카드 데이터 조회",
  "GET /api/miniu/chat/quota": "AI 채팅 사용량 조회",
  "POST /api/miniu/chat": "AI 채팅 전송",
  "GET /api/miniu/notifications": "알림 목록 조회",
  "PATCH /api/miniu/notifications/{id}/read": "알림 읽음 처리",
  "GET /api/miniu/notification-settings": "알림 설정 조회",
  "PATCH /api/miniu/notification-settings": "알림 설정 수정",
  "GET /api/miniu/affections": "애정표현 활동 목록 조회",
  "POST /api/miniu/affections": "애정표현 활동 저장",
  "GET /api/miniu/house": "집 방문·홈 요약 조회",
  "GET /api/miniu/item-suggestions": "아이템 제안 목록 조회",
  "POST /api/miniu/item-suggestions/{id}/accept": "아이템 제안 승인",
  "POST /api/miniu/item-suggestions/{id}/reject": "아이템 제안 거절",
  "GET /api/miniu/inventory": "인벤토리 조회",
  "PATCH /api/miniu/inventory/{id}": "아이템 착용 변경",
  "GET /api/miniu/share-scene": "공유 이미지 씬 데이터 조회",
  "POST /api/miniu/share-phrases": "공유 대표 문구 생성",
};

const requestBodyRefs = {
  "POST /api/miniu/auth/signup": "SignupRequest",
  "POST /api/miniu/auth/login": "LoginRequest",
  "POST /api/miniu/auth/verify": "VerifyEmailRequest",
  "POST /api/miniu/auth/resend-verification": "EmailRequest",
  "POST /api/miniu/auth/delete": "ConfirmRequest",
  "POST /api/miniu/invitations/accept": "AcceptInvitationRequest",
  "POST /api/miniu/couple/unlink": "ConfirmRequest",
  "POST /api/miniu/onboarding/pre-questions": "PreQuestionsRequest",
  "POST /api/miniu/miniu": "MiniuRequest",
  "PATCH /api/miniu/miniu": "MiniuPatchRequest",
  "POST /api/miniu/records": "RecordRequest",
  "PATCH /api/miniu/profile-cards/{id}": "ProfileCardPatchRequest",
  "POST /api/miniu/profile-cards/{id}/merge": "ProfileCardMergeRequest",
  "POST /api/miniu/letters": "LetterRequest",
  "POST /api/miniu/letters/attachments": "LetterAttachmentUploadRequest",
  "POST /api/miniu/chat": "ChatRequest",
  "PATCH /api/miniu/notification-settings": "NotificationSettingsRequest",
  "POST /api/miniu/affections": "AffectionRequest",
  "PATCH /api/miniu/inventory/{id}": "InventoryPatchRequest",
  "POST /api/miniu/share-phrases": "SharePhrasesRequest",
};

function routeFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) return routeFiles(absolute);
    return entry.name === "route.ts" ? [absolute] : [];
  });
}

function routePath(file) {
  const routeDir = path.dirname(path.relative(API_ROOT, file));
  return `/api/${routeDir.split(path.sep).map((part) => (part.startsWith("[") && part.endsWith("]") ? `{${part.slice(1, -1)}}` : part)).join("/")}`;
}

function routeMethods(source) {
  return HTTP_METHODS.filter((method) => new RegExp(`export\\s+async\\s+function\\s+${method}\\b`).test(source));
}

function tagFor(apiPath) {
  const [, , , first, second] = apiPath.split("/");
  if (first === "auth") return "Auth";
  if (first === "profile-cards") return "Profile Cards";
  if (first === "onboarding") return "Onboarding";
  if (first === "letters") return second === "attachments" ? "Letter Attachments" : "Letters";
  return first ? first.replace(/(^|-)([a-z])/g, (_match, _dash, char) => ` ${char.toUpperCase()}`).trim() : "MINIU";
}

function pathParameters(apiPath) {
  return [...apiPath.matchAll(/\{([^}]+)\}/g)].map((match) => ({
    name: match[1],
    in: "path",
    required: true,
    schema: { type: "string" },
  }));
}

function operationId(method, apiPath) {
  return `${method.toLowerCase()}${apiPath.replace(/^\/api\/miniu/, "").replace(/\{([^}]+)\}/g, "By_$1").split(/[/-]/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("")}`;
}

function requestBody(schemaName) {
  if (!schemaName) return undefined;
  if (schemaName === "LetterAttachmentUploadRequest") {
    return {
      required: true,
      content: {
        "multipart/form-data": {
          schema: { $ref: `#/components/schemas/${schemaName}` },
        },
      },
    };
  }
  return {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: `#/components/schemas/${schemaName}` },
      },
    },
  };
}

function operation(method, apiPath) {
  const key = `${method} ${apiPath}`;
  const body = requestBody(requestBodyRefs[key]);
  return {
    tags: [tagFor(apiPath)],
    summary: operationSummaries[key] ?? `${method} ${apiPath}`,
    operationId: operationId(method, apiPath),
    ...(publicOperations.has(key) ? {} : { security: [{ miniuSession: [] }] }),
    ...(pathParameters(apiPath).length > 0 ? { parameters: pathParameters(apiPath) } : {}),
    ...(body ? { requestBody: body } : {}),
    responses: {
      200: { description: "성공", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
      201: { description: "생성 성공", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
      400: { description: "잘못된 요청", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      401: { description: "로그인 필요", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      403: { description: "권한 없음", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      404: { description: "찾을 수 없음", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      409: { description: "충돌", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
      500: { description: "서버 오류", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
    },
  };
}

function schemas() {
  const string = { type: "string" };
  const boolean = { type: "boolean" };
  return {
    SuccessResponse: {
      type: "object",
      required: ["ok", "data"],
      properties: { ok: { type: "boolean", const: true }, data: { type: "object", additionalProperties: true } },
    },
    ErrorResponse: {
      type: "object",
      required: ["ok", "error"],
      properties: {
        ok: { type: "boolean", const: false },
        error: {
          type: "object",
          required: ["code", "message", "details"],
          properties: { code: string, message: string, details: { type: ["object", "null"], additionalProperties: true } },
        },
      },
    },
    SignupRequest: {
      type: "object",
      required: ["name", "birthDate", "email", "password", "terms", "privacyRequired", "processorTransferNotice", "aiAnalysisTransfer", "partnerInfoResponsibility", "age14OrOver"],
      properties: {
        name: string,
        birthDate: { type: "string", format: "date" },
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 8, maxLength: 16 },
        terms: boolean,
        privacyRequired: boolean,
        processorTransferNotice: boolean,
        aiAnalysisTransfer: boolean,
        partnerInfoResponsibility: boolean,
        age14OrOver: boolean,
        marketing: boolean,
      },
    },
    LoginRequest: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email" }, password: string } },
    VerifyEmailRequest: { type: "object", properties: { token: string, tokenHash: string, token_hash: string, type: { type: "string", enum: ["signup", "email", "magiclink"] } } },
    EmailRequest: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } },
    ConfirmRequest: { type: "object", required: ["confirmed"], properties: { confirmed: boolean } },
    AcceptInvitationRequest: { type: "object", required: ["code"], properties: { code: string } },
    PreQuestionsRequest: {
      type: "object",
      required: ["relationshipStartedOn", "likes", "dislikes", "tendencies", "habits", "values"],
      properties: {
        relationshipStartedOn: { type: "string", format: "date" },
        likes: { type: "array", items: string },
        dislikes: { type: "array", items: string },
        tendencies: { type: "array", items: string },
        habits: { type: "array", items: string },
        values: { type: "array", items: string },
      },
    },
    MiniuRequest: {
      type: "object",
      required: ["name", "preset", "hairStyle", "hairColor", "skinTone", "faceShape", "expression"],
      properties: { name: string, preset: string, hairStyle: string, hairColor: string, skinTone: string, faceShape: string, expression: string },
    },
    MiniuPatchRequest: {
      type: "object",
      properties: { name: string, preset: string, hairStyle: string, hairColor: string, skinTone: string, faceShape: string, expression: string },
    },
    RecordRequest: { type: "object", required: ["content", "happenedOn"], properties: { content: string, happenedOn: { type: "string", format: "date" } } },
    ProfileCardPatchRequest: { type: "object", properties: { content: string, category: { type: "string", enum: ["likes", "dislikes", "values", "habits", "tendencies"] } } },
    ProfileCardMergeRequest: { type: "object", required: ["targetCardId"], properties: { targetCardId: string } },
    LetterRequest: {
      type: "object",
      required: ["content"],
      properties: {
        content: string,
        attachments: { type: "array", maxItems: 4, items: { type: "object", required: ["storagePath", "mimeType", "sizeBytes"], properties: { storagePath: string, mimeType: string, sizeBytes: { type: "integer" } } } },
      },
    },
    LetterAttachmentUploadRequest: { type: "object", required: ["file"], properties: { file: { type: "string", format: "binary" } } },
    ChatRequest: { type: "object", required: ["message"], properties: { message: string } },
    NotificationSettingsRequest: {
      type: "object",
      properties: {
        couple_connected: boolean,
        letter_received: boolean,
        affection_received: boolean,
        profile_merge_candidate: boolean,
      },
    },
    AffectionRequest: {
      type: "object",
      required: ["affectionType"],
      properties: {
        affectionType: { type: "string", enum: ["hug", "kiss", "pat"] },
      },
    },
    InventoryPatchRequest: {
      type: "object",
      required: ["equipped"],
      properties: {
        equipped: boolean,
      },
    },
    SharePhrasesRequest: {
      type: "object",
      properties: {
        customPhrase: { type: "string", maxLength: 40 },
      },
    },
  };
}

function buildSpec() {
  const paths = {};
  for (const file of routeFiles(API_ROOT)) {
    const source = fs.readFileSync(file, "utf8");
    const apiPath = routePath(file);
    const methods = routeMethods(source);
    if (methods.length === 0) continue;
    paths[apiPath] = Object.fromEntries(methods.map((method) => [method.toLowerCase(), operation(method, apiPath)]));
  }
  return {
    openapi: "3.1.0",
    info: {
      title: "MINIU Backend API",
      version: "0.1.0",
      description: "app/api/miniu 라우트 파일을 스캔해 생성한 OpenAPI 문서입니다.",
    },
    servers: [{ url: "http://localhost:3000", description: "Local" }],
    paths: Object.fromEntries(Object.entries(paths).sort(([a], [b]) => a.localeCompare(b))),
    components: {
      securitySchemes: {
        miniuSession: { type: "apiKey", in: "cookie", name: "miniu_session" },
      },
      schemas: schemas(),
    },
  };
}

fs.mkdirSync(FEATURE_DIR, { recursive: true });
fs.writeFileSync(OUTPUT, `${JSON.stringify(buildSpec(), null, 2)}\n`);
console.log(`생성 완료: ${path.relative(ROOT, OUTPUT).split(path.sep).join("/")}`);
