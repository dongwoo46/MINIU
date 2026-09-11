"use client";
import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { PreviewTab } from "@/shared/config/design-system";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Surface } from "@/shared/ui/surface";
import { TextField } from "@/shared/ui/text-field";
import { Toast } from "@/shared/ui/toast";
import { LetterPreview } from "@/widgets/letter-preview";
import { ProfilePreview } from "@/widgets/profile-preview";
import { MobileShell } from "@/widgets/mobile-shell";
import { SetupPreview } from "@/widgets/setup-preview";

type PublicUser = {
  id: string;
  name: string;
  birthDate: string;
  email: string;
  emailVerifiedAt: string | null;
  onboardingStep: "emailVerification" | "coupleLink" | "preQuestions" | "home";
};

type PublicInvitation = {
  id: string;
  codePreview: string;
  link: string;
  expiresAt: string;
};

type MeData = {
  user: PublicUser;
  couple: { id: string; userIds: [string, string]; status: "connected" } | null;
  miniu: { id: string; name: string } | null;
  onboarding: {
    needsPreQuestions: boolean;
    isComplete: boolean;
  };
};

type ApiSuccess<T> = { ok: true; data: T };
type ApiFailure = { ok: false; error: { code: string; message: string; details: Record<string, string> | null } };
type AuthMode = "login" | "signup" | "verify";
type PreQuestionKey = "likes" | "dislikes" | "tendencies" | "habits" | "values";

const requiredConsentItems = [
  {
    id: "terms",
    label: "[필수] 미니유 서비스 이용약관에 동의합니다.",
    shortLabel: "미니유 서비스 이용약관 동의",
    detail: "서비스 제공 범위, 회원 의무, 금지 행위, 기록 관리, 서비스 변경·중단, 계약 해지, 회원 탈퇴, 책임 한계, 준거법과 관할을 확인합니다. 연인 등 제3자 정보를 입력할 때 정당한 권한을 갖추고 필요한 경우 동의를 받을 책임도 포함됩니다.",
  },
  {
    id: "privacyRequired",
    label: "[필수] 개인정보 수집·이용에 동의합니다.",
    shortLabel: "개인정보 수집·이용 동의",
    detail: "회원 식별·인증, 이메일 인증, 연령 확인, 커플 연결, 기록·프로필·채팅·문자 기능 제공, 보안과 장애 대응을 위해 이메일, 비밀번호, 닉네임, 생년월일, 커플 연결 정보, 서비스 이용기록을 처리합니다. 보유 기간은 회원 탈퇴 후 30일까지를 기본으로 합니다.",
  },
  {
    id: "processorTransferNotice",
    label: "[필수] 개인정보 처리위탁 및 국외 이전 안내를 확인했습니다.",
    shortLabel: "개인정보 처리위탁 및 국외 이전 안내",
    detail: "서비스 서버·DB·스토리지 운영, 가입 인증 메일 발송, 기록·문자·대화 캡처의 AI 분석을 외부 사업자에게 위탁할 수 있고, 일부 정보는 국외에서 처리될 수 있습니다. 실제 수탁사·국가·보유기간은 계약 확정 후 처리방침에 반영됩니다.",
  },
  {
    id: "aiAnalysisTransfer",
    label: "[필수] 대화·캡처의 AI 분석 및 국외 이전에 동의합니다.",
    shortLabel: "대화·캡처의 AI 분석 및 국외 이전 동의",
    detail: "말투 설정과 AI 채팅 이용 시 사용자가 입력한 대화 내용, 대화 캡처 이미지, 말투 요약 결과가 국외 AI 처리 사업자에게 전송·처리될 수 있습니다. 대화 캡처 원본은 분석 직후 삭제하며, 캡처를 올리지 않으면 기본 말투로 동작합니다.",
  },
  {
    id: "partnerInfoResponsibility",
    label: "[필수] 연인 정보 입력 책임과 민감정보 미입력을 확인했습니다.",
    shortLabel: "연인 정보 입력 책임과 민감정보 미입력",
    detail: "연인의 이름·닉네임, 취향, 습관, 성향, 가치관, 일상 정보, 대화 내용과 이를 바탕으로 AI가 만든 프로필 카드·말투 요약이 처리될 수 있습니다. 건강, 종교, 정치적 견해, 성생활 등 민감한 정보나 연인이 원치 않는 내용은 입력하지 않아야 하며, 연인은 삭제·처리정지를 요청할 수 있습니다.",
  },
  {
    id: "age14OrOver",
    label: "[필수] 만 14세 이상입니다.",
    shortLabel: "만 14세 이상",
    detail: "미니유는 만 14세 미만 아동의 가입을 받지 않습니다. 생년월일로 만 14세 미만으로 확인되면 회원가입이 차단됩니다.",
  },
] as const;

const marketingConsent = {
  label: "[선택] 마케팅·광고성 정보 수신에 동의합니다.",
  shortLabel: "마케팅·광고성 정보 수신 동의",
  detail: "이벤트, 혜택, 신규 기능 안내 등 광고성 정보를 이메일로 받을 수 있습니다. 동의하지 않아도 가입과 핵심 서비스 이용에는 제한이 없고, 언제든 철회할 수 있습니다.",
};

const MOCK_EMAIL_CODE = "123456";
const EMAIL_CODE_SECONDS = 300;
type EmailVerifyStatus = "idle" | "pending" | "verified";

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const preQuestionLabels: Record<PreQuestionKey, { label: string; placeholder: string }> = {
  likes: { label: "좋아하는 것", placeholder: "예: 산책, 아이스 아메리카노" },
  dislikes: { label: "싫어하는 것", placeholder: "예: 갑작스러운 일정 변경" },
  tendencies: { label: "평소 성향", placeholder: "예: 낯가림이 있지만 친해지면 장난이 많음" },
  habits: { label: "자주 하는 습관", placeholder: "예: 자기 전에 음악을 듣는다" },
  values: { label: "중요하게 생각하는 가치", placeholder: "예: 약속을 지키는 것" },
};

export default function Home() {
  const [tab, setTab] = useState<PreviewTab>("home");
  const [toast, setToast] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [birthDigits, setBirthDigits] = useState("");
  const [showConsentSheet, setShowConsentSheet] = useState(false);
  const [emailVerifyStatus, setEmailVerifyStatus] = useState<EmailVerifyStatus>("idle");
  const [emailVerifyCode, setEmailVerifyCode] = useState("");
  const [emailVerifyError, setEmailVerifyError] = useState(false);
  const [emailVerifySeconds, setEmailVerifySeconds] = useState(EMAIL_CODE_SECONDS);
  const [me, setMe] = useState<MeData | null>(null);
  const [pending, setPending] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [devVerificationCode, setDevVerificationCode] = useState("");
  const [invitation, setInvitation] = useState<PublicInvitation | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [preQuestions, setPreQuestions] = useState<Record<PreQuestionKey, string> & { relationshipStartedOn: string }>({
    relationshipStartedOn: "",
    likes: "",
    dislikes: "",
    tendencies: "",
    habits: "",
    values: "",
  });
  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    email: "",
    password: "",
    passwordConfirm: "",
    code: "",
    terms: true,
    privacyRequired: true,
    processorTransferNotice: true,
    aiAnalysisTransfer: true,
    partnerInfoResponsibility: true,
    age14OrOver: true,
    marketing: false,
  });

  useEffect(() => {
    fetch("/api/miniu/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiSuccess<MeData> | ApiFailure) => {
        if (payload.ok) {
          setMe(payload.data);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!me || me.user.onboardingStep !== "coupleLink") {
      return;
    }
    fetch("/api/miniu/invitations", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiSuccess<{ invitation: PublicInvitation | null }> | ApiFailure) => {
        if (payload.ok) {
          setInvitation(payload.data.invitation);
          setInviteLink(payload.data.invitation?.link ?? "");
        }
      })
      .catch(() => undefined);
  }, [me]);

  useEffect(() => {
    if (emailVerifyStatus !== "pending") {
      return;
    }
    const timer = setInterval(() => {
      setEmailVerifySeconds((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailVerifyStatus]);

  function requestEmailVerifyCode() {
    if (!form.email) {
      return;
    }
    setEmailVerifyStatus("pending");
    setEmailVerifyError(false);
    setEmailVerifyCode("");
    setEmailVerifySeconds(EMAIL_CODE_SECONDS);
    setToast(`개발 목업: 인증코드 ${MOCK_EMAIL_CODE} (실제 이메일 발송은 아직 연결되지 않았어요)`);
  }

  function handleEmailVerifyCodeChange(value: string) {
    setEmailVerifyCode(value.replace(/\D/g, "").slice(0, 6));
    setEmailVerifyError(false);
  }

  function submitEmailVerifyCode() {
    if (emailVerifyCode === MOCK_EMAIL_CODE) {
      setEmailVerifyStatus("verified");
      setEmailVerifyError(false);
    } else {
      setEmailVerifyError(true);
    }
  }

  const showPreview = () => setToast("지금은 화면 프리뷰예요. 입력한 내용은 전송·저장되지 않아요.");
  function formatBirthDisplay(digits: string) {
    return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join(".");
  }
  function handleBirthDateChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    setBirthDigits(digits);
    const combined = digits.length === 8 ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : "";
    setForm((prev) => ({ ...prev, birthDate: combined }));
  }
  const allRequiredChecked = requiredConsentItems.every((item) => form[item.id]);
  const under14 = useMemo(() => {
    if (!form.birthDate) {
      return false;
    }
    const birthday = new Date(`${form.birthDate}T00:00:00`);
    if (Number.isNaN(birthday.getTime())) {
      return false;
    }
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const birthdayThisYear = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
    if (today < birthdayThisYear) {
      age -= 1;
    }
    return age < 14;
  }, [form.birthDate]);
  const passwordsMatch = form.password.length > 0 && form.password === form.passwordConfirm;
  const signupFieldsComplete = Boolean(form.name && form.birthDate && form.email && form.password && passwordsMatch) && !under14 && emailVerifyStatus === "verified";

  async function requestJson<T>(path: string, body?: Record<string, unknown>, method: "POST" | "PATCH" = "POST"): Promise<T> {
    setPending(true);
    try {
      const response = await fetch(path, {
        method: body ? method : "GET",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = (await response.json()) as ApiSuccess<T> | ApiFailure;
      if (!payload.ok) {
        throw new Error(payload.error.message);
      }
      return payload.data;
    } finally {
      setPending(false);
    }
  }

  async function loadMe() {
    const data = await requestJson<MeData>("/api/miniu/me");
    setMe(data);
  }

  async function submitSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allRequiredChecked || under14) {
      setToast(under14 ? "만 14세 미만은 가입할 수 없어요." : "필수 동의를 모두 체크해야 가입할 수 있어요.");
      return;
    }
    try {
      const data = await requestJson<{ user: PublicUser; devVerificationCode: string }>("/api/miniu/auth/signup", {
        name: form.name,
        birthDate: form.birthDate,
        email: form.email,
        password: form.password,
        terms: form.terms,
        privacyRequired: form.privacyRequired,
        processorTransferNotice: form.processorTransferNotice,
        aiAnalysisTransfer: form.aiAnalysisTransfer,
        partnerInfoResponsibility: form.partnerInfoResponsibility,
        age14OrOver: form.age14OrOver,
        marketing: form.marketing,
      });
      setAuthEmail(data.user.email);
      setDevVerificationCode(data.devVerificationCode);
      setMode("verify");
      setToast("인증 코드를 보냈어요. 개발 환경에서는 화면의 코드를 입력하세요.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "회원가입에 실패했어요.");
    }
  }

  async function submitVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await requestJson<{ user: PublicUser }>("/api/miniu/auth/verify", {
        email: authEmail || form.email,
        code: form.code,
      });
      await loadMe();
      setToast("이메일 인증이 완료됐어요.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "인증에 실패했어요.");
    }
  }

  async function resendVerification() {
    try {
      const data = await requestJson<{ devVerificationCode: string }>("/api/miniu/auth/resend-verification", {
        email: authEmail || form.email,
      });
      setDevVerificationCode(data.devVerificationCode);
      setToast("인증 코드를 다시 보냈어요.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "재발송에 실패했어요.");
    }
  }

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await requestJson<{ user: PublicUser }>("/api/miniu/auth/login", {
        email: form.email,
        password: form.password,
      });
      await loadMe();
      setToast("로그인됐어요.");
    } catch (error) {
      if (error instanceof Error && error.message.includes("verification")) {
        setAuthEmail(form.email);
        setMode("verify");
      }
      setToast(error instanceof Error ? error.message : "로그인에 실패했어요.");
    }
  }

  async function logout() {
    try {
      await requestJson<{ loggedOut: boolean }>("/api/miniu/auth/logout", {});
      setMe(null);
      setMode("login");
      setToast("로그아웃됐어요.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "로그아웃에 실패했어요.");
    }
  }

  async function createInvitation() {
    try {
      const data = await requestJson<{ invitation: PublicInvitation; code: string; link: string }>("/api/miniu/invitations", {});
      setInvitation(data.invitation);
      setInviteLink(data.link);
      setToast("초대 코드가 만들어졌어요.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "초대 코드 생성에 실패했어요.");
    }
  }

  async function continueToPreQuestions() {
    try {
      await requestJson<{ nextStep: "preQuestions" }>("/api/miniu/invitations", {}, "PATCH");
      await loadMe();
      setToast("사전 질문으로 이어갈게요.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "다음 단계로 이동하지 못했어요.");
    }
  }

  async function acceptInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await requestJson<{ couple: MeData["couple"] }>("/api/miniu/invitations/accept", { code: inviteCodeInput });
      await loadMe();
      setToast("커플 연결이 완료됐어요.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "커플 연결에 실패했어요.");
    }
  }

  async function submitPreQuestions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await requestJson<{ cardCount: number }>("/api/miniu/onboarding/pre-questions", {
        relationshipStartedOn: preQuestions.relationshipStartedOn,
        likes: splitAnswer(preQuestions.likes),
        dislikes: splitAnswer(preQuestions.dislikes),
        tendencies: splitAnswer(preQuestions.tendencies),
        habits: splitAnswer(preQuestions.habits),
        values: splitAnswer(preQuestions.values),
      });
      await loadMe();
      setToast("사전 질문이 저장됐어요.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "사전 질문 저장에 실패했어요.");
    }
  }

  if (!me) {
    return (
      <AuthShell hideTopBar={mode === "login" || mode === "signup"} mainClassName={mode === "login" || mode === "signup" ? "login-main" : undefined}>
        {mode === "signup" && (
          <div className="login-screen signup-screen">
            <Image src="/login/bg-decor.png" alt="" width={404} height={404} className="login-bg-decor" priority aria-hidden />
            <span className="login-logo text-display-m">MINIU</span>
            <div className="login-card">
              <div className="login-panel signup-panel">
                <AuthHeading title="회원가입" description={"이메일 인증과 필수 동의를\n완료해주세요"} />
                <div className="login-fields signup-fields">
                  <div className="login-field">
                    <TextField label="닉네임" placeholder="닉네임을 입력해주세요" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                  </div>
                  <div className="login-field">
                    <TextField label="생년월일" inputMode="numeric" maxLength={10} placeholder="yyyy.mm.dd" value={formatBirthDisplay(birthDigits)} onChange={(event) => handleBirthDateChange(event.target.value)} error={under14 ? "만 14세 미만은 가입할 수 없어요." : undefined} required />
                  </div>
                  <div className="login-field login-field--email">
                    <div className="field-group flex flex-col gap-2">
                      <label htmlFor="signup-email" className="text-xs font-bold">이메일</label>
                      <div className="login-field--row">
                        <div className={emailVerifyStatus === "idle" ? "field-box" : "field-box is-disabled"}>
                          <input
                            id="signup-email"
                            className="field-box-input"
                            type="email"
                            placeholder="이메일을 입력해주세요"
                            value={form.email}
                            readOnly={emailVerifyStatus !== "idle"}
                            onChange={(event) => setForm({ ...form, email: event.target.value })}
                            required
                          />
                          {emailVerifyStatus === "verified" && <Icon name="check" width={16} height={16} className="signup-consent-check signup-consent-check--on" />}
                        </div>
                        <button type="button" className="signup-verify-button text-label-kr" disabled={!form.email} onClick={requestEmailVerifyCode}>
                          {emailVerifyStatus === "idle" ? "이메일 인증" : "재전송하기"}
                        </button>
                      </div>
                    </div>
                  </div>
                  {emailVerifyStatus !== "idle" && (
                    <div className="login-field">
                      <div className="field-group flex flex-col gap-2">
                        <label htmlFor="signup-email-code" className="text-xs font-bold">인증번호</label>
                        <div className="login-field--row">
                          <div className="field-box">
                            <input
                              id="signup-email-code"
                              className="field-box-input"
                              inputMode="numeric"
                              placeholder="인증번호를 입력해주세요"
                              value={emailVerifyCode}
                              readOnly={emailVerifyStatus === "verified"}
                              onChange={(event) => handleEmailVerifyCodeChange(event.target.value)}
                            />
                            {emailVerifyStatus === "verified" ? (
                              <Icon name="check" width={16} height={16} className="signup-consent-check signup-consent-check--on" />
                            ) : (
                              <span className="field-box-suffix">{formatCountdown(emailVerifySeconds)}</span>
                            )}
                          </div>
                          <button type="button" className="signup-verify-button text-label-kr" disabled={emailVerifyStatus === "verified"} onClick={submitEmailVerifyCode}>
                            {emailVerifyStatus === "verified" ? "인증완료" : "인증하기"}
                          </button>
                        </div>
                      </div>
                      {emailVerifyError && <p className="signup-field-caption signup-field-caption--error text-caption-s">인증번호가 일치하지 않아요</p>}
                      {emailVerifyStatus === "verified" && <p className="signup-field-caption signup-field-caption--success text-caption-s">인증이 완료됐어요!</p>}
                    </div>
                  )}
                  <div className="login-field login-field--password">
                    <TextField label="비밀번호" type={showPassword ? "text" : "password"} placeholder="비밀번호를 입력해주세요" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} hint="8~16자, 숫자와 특수문자 포함" required />
                    <button type="button" className="signup-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}>
                      <Icon name={showPassword ? "eye" : "eye-off"} width={16} height={16} />
                    </button>
                  </div>
                  <div className="login-field">
                    <TextField label="비밀번호 확인" type="password" placeholder="비밀번호를 한번 더 입력해주세요" value={form.passwordConfirm} onChange={(event) => setForm({ ...form, passwordConfirm: event.target.value })} required />
                    {form.passwordConfirm && !passwordsMatch && <p className="signup-field-caption signup-field-caption--error text-caption-s">비밀번호가 일치하지 않아요</p>}
                  </div>
                </div>
                <div className="login-actions">
                  <Button type="button" fullWidth disabled={!signupFieldsComplete} className="login-submit" onClick={() => setShowConsentSheet(true)}>
                    <span className="text-label-en">DONE ▶</span>
                  </Button>
                  <button className="login-signup-link text-label-kr" type="button" onClick={() => setMode("login")}>이미 계정이 있어요</button>
                </div>
              </div>
            </div>
            {showConsentSheet && (
              <div className="signup-consent-dimmed">
                <div className="signup-consent-container">
                  <form className="signup-consent-sheet" onSubmit={submitSignup}>
                    <div className="signup-consent-close-row">
                      <button type="button" aria-label="닫기" onClick={() => setShowConsentSheet(false)}>
                        <Icon name="close" width={20} height={20} />
                      </button>
                    </div>
                    <div className="signup-consent-body">
                      <p className="text-body-l">약관에 동의해주세요</p>
                      <div className="signup-consent-list">
                        <label className="signup-consent-row signup-consent-row--all">
                          <Icon name="check" width={16} height={16} className={allRequiredChecked && form.marketing ? "signup-consent-check signup-consent-check--on" : "signup-consent-check"} />
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={allRequiredChecked && form.marketing}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setForm({ ...form, terms: checked, privacyRequired: checked, processorTransferNotice: checked, aiAnalysisTransfer: checked, partnerInfoResponsibility: checked, age14OrOver: checked, marketing: checked });
                            }}
                          />
                          <span className="signup-consent-tag text-body-m">[필수]</span>
                          <span className="signup-consent-text text-body-m">전체 동의</span>
                        </label>
                        <div className="signup-consent-divider">
                          {requiredConsentItems.map((item) => (
                            <label key={item.id} className="signup-consent-row">
                              <Icon name="check" width={16} height={16} className={form[item.id] ? "signup-consent-check signup-consent-check--on" : "signup-consent-check"} />
                              <input type="checkbox" className="sr-only" checked={form[item.id]} onChange={(event) => setForm({ ...form, [item.id]: event.target.checked })} />
                              <span className="signup-consent-tag signup-consent-tag--required text-label-kr">[필수]</span>
                              <span className="signup-consent-text text-label-kr">{item.shortLabel}</span>
                              <Icon name="chevron" width={14} height={14} className="signup-consent-chevron" />
                            </label>
                          ))}
                          <label className="signup-consent-row">
                            <Icon name="check" width={16} height={16} className={form.marketing ? "signup-consent-check signup-consent-check--on" : "signup-consent-check"} />
                            <input type="checkbox" className="sr-only" checked={form.marketing} onChange={(event) => setForm({ ...form, marketing: event.target.checked })} />
                            <span className="signup-consent-tag signup-consent-tag--optional text-label-kr">[선택]</span>
                            <span className="signup-consent-text text-label-kr">{marketingConsent.shortLabel}</span>
                            <Icon name="chevron" width={14} height={14} className="signup-consent-chevron" />
                          </label>
                        </div>
                      </div>
                      <Button type="submit" fullWidth disabled={pending || !allRequiredChecked || under14} className="login-submit">
                        <span className="text-label-en">DONE ▶</span>
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
        {mode === "login" && (
          <div className="login-screen">
            <Image src="/login/bg-decor.png" alt="" width={404} height={404} className="login-bg-decor" priority aria-hidden />
            <span className="login-logo text-display-m">MINIU</span>
            <div className="login-card">
              <form className="login-panel" onSubmit={submitLogin}>
                <AuthHeading title="로그인" description={"이메일 인증을 마친 계정만\n로그인할 수 있어요."} />
                <div className="login-fields">
                  <div className="login-field login-field--email">
                    <TextField label="이메일" type="email" placeholder="이메일을 입력해주세요" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
                  </div>
                  <div className="login-field">
                    <TextField label="비밀번호" type="password" placeholder="비밀번호를 입력해주세요" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
                  </div>
                </div>
                <div className="login-actions">
                  <Button type="submit" fullWidth disabled={pending} className="login-submit">
                    <span className="text-label-en">LOGIN ▶</span>
                  </Button>
                  <button className="login-signup-link text-label-kr" type="button" onClick={() => setMode("signup")}>새 계정 만들기</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {mode === "verify" && (
          <form className="auth-panel" onSubmit={submitVerify}>
            <AuthHeading title="이메일 인증" description={`${authEmail || form.email || "가입 이메일"}로 보낸 6자리 코드를 입력하세요.`} />
            {devVerificationCode && <Surface className="auth-code">개발 인증 코드 <strong>{devVerificationCode}</strong></Surface>}
            <TextField label="인증 코드" inputMode="numeric" maxLength={6} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
            <Button type="submit" fullWidth disabled={pending}>인증 완료</Button>
            <button className="auth-link" type="button" onClick={resendVerification}>인증 코드 다시 받기</button>
            <button className="auth-link" type="button" onClick={() => setMode("login")}>로그인으로 돌아가기</button>
          </form>
        )}
        <Toast message={toast} onDismiss={() => setToast("")} />
      </AuthShell>
    );
  }

  const user = me.user;

  if (me.user.onboardingStep === "coupleLink") {
    return (
      <AuthShell user={user} onLogout={logout}>
        <CoupleLinkStep
          invitation={invitation}
          inviteLink={inviteLink}
          inviteCodeInput={inviteCodeInput}
          pending={pending}
          onInviteCodeChange={setInviteCodeInput}
          onCreateInvitation={createInvitation}
          onAcceptInvitation={acceptInvitation}
          onContinue={continueToPreQuestions}
        />
        <Toast message={toast} onDismiss={() => setToast("")} />
      </AuthShell>
    );
  }

  if (me.user.onboardingStep === "preQuestions" || me.onboarding.needsPreQuestions) {
    return (
      <AuthShell user={user} onLogout={logout}>
        <PreQuestionStep values={preQuestions} pending={pending} onChange={setPreQuestions} onSubmit={submitPreQuestions} />
        <Toast message={toast} onDismiss={() => setToast("")} />
      </AuthShell>
    );
  }

  return (
    <MobileShell active={tab} onTabChange={(next) => { setTab(next); setToast(""); }}>
      <div className="auth-user-strip"><span>{user.name}님</span><button type="button" onClick={logout}>로그아웃</button></div>
      {!me.couple && <Surface className="onboarding-banner"><strong>연인과 연결하기</strong><span>홈은 볼 수 있지만 기록·프로필·문자·채팅은 연결 후 열려요.</span></Surface>}
      {tab === "home" && <SetupPreview onPreview={showPreview} />}
      {tab === "letter" && <LetterPreview onPreview={showPreview} />}
      {tab === "profile" && <ProfilePreview onPreview={showPreview} />}
      <Toast message={toast} onDismiss={() => setToast("")} />
    </MobileShell>
  );
}

function CoupleLinkStep({
  invitation,
  inviteLink,
  inviteCodeInput,
  pending,
  onInviteCodeChange,
  onCreateInvitation,
  onAcceptInvitation,
  onContinue,
}: {
  invitation: PublicInvitation | null;
  inviteLink: string;
  inviteCodeInput: string;
  pending: boolean;
  onInviteCodeChange: (value: string) => void;
  onCreateInvitation: () => void;
  onAcceptInvitation: (event: FormEvent<HTMLFormElement>) => void;
  onContinue: () => void;
}) {
  return (
    <section className="auth-panel">
      <AuthHeading title="연인과 연결하기" description="초대 코드를 공유하거나 받은 코드를 입력하세요. 연결 전에도 사전 질문은 먼저 진행할 수 있어요." />
      <Surface className="onboarding-card">
        <span>내 초대 코드</span>
        <strong>{invitation?.codePreview ?? "아직 없음"}</strong>
        {inviteLink && <p>{inviteLink}</p>}
        <Button type="button" fullWidth onClick={onCreateInvitation} disabled={pending}>{invitation ? "초대 코드 다시 만들기" : "초대 코드 만들기"}</Button>
      </Surface>
      <form className="onboarding-card onboarding-card--form" onSubmit={onAcceptInvitation}>
        <TextField label="받은 초대 코드" value={inviteCodeInput} onChange={(event) => onInviteCodeChange(event.target.value)} placeholder="예: K7M2QP9A" />
        <Button type="submit" fullWidth disabled={pending || !inviteCodeInput.trim()}>코드로 연결하기</Button>
      </form>
      <Button type="button" variant="secondary" fullWidth onClick={onContinue} disabled={pending}>건너뛰고 사전 질문으로</Button>
    </section>
  );
}

function PreQuestionStep({
  values,
  pending,
  onChange,
  onSubmit,
}: {
  values: Record<PreQuestionKey, string> & { relationshipStartedOn: string };
  pending: boolean;
  onChange: (values: Record<PreQuestionKey, string> & { relationshipStartedOn: string }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const complete = Boolean(values.relationshipStartedOn) && (Object.keys(preQuestionLabels) as PreQuestionKey[]).every((key) => values[key].trim());
  return (
    <form className="auth-panel" onSubmit={onSubmit}>
      <AuthHeading title="사전 질문" description="모든 항목은 필수예요. 답변은 초기 프로필 카드와 D-day 기준이 됩니다." />
      <Surface className="third-party-notice">연인이 원치 않을 민감한 정보(건강·종교·정치·성생활 등)나 다른 사람의 정보는 넣지 마세요.</Surface>
      <TextField label="사귄 날짜" type="date" value={values.relationshipStartedOn} onChange={(event) => onChange({ ...values, relationshipStartedOn: event.target.value })} required />
      {(Object.keys(preQuestionLabels) as PreQuestionKey[]).map((key) => (
        <TextField key={key} label={preQuestionLabels[key].label} placeholder={preQuestionLabels[key].placeholder} value={values[key]} onChange={(event) => onChange({ ...values, [key]: event.target.value })} required />
      ))}
      <Button type="submit" fullWidth disabled={pending || !complete}>저장하고 홈으로</Button>
    </form>
  );
}

function AuthShell({
  children,
  user,
  onLogout,
  hideTopBar,
  mainClassName,
}: {
  children: ReactNode;
  user?: PublicUser;
  onLogout?: () => void;
  hideTopBar?: boolean;
  mainClassName?: string;
}) {
  return (
    <div className="site-frame">
      <div className="mobile-shell auth-shell">
        {!hideTopBar && (
          <header className="top-bar">
            <span className="wordmark">miniu<span className="wordmark-dot">◆</span></span>
            {user ? <button className="top-bar-link" type="button" onClick={onLogout}>로그아웃</button> : <span className="top-bar-caption">이메일 인증 가입</span>}
          </header>
        )}
        <main className={mainClassName}>{children}</main>
      </div>
    </div>
  );
}

function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="page-heading">
      <span className="eyebrow">MINIU ACCOUNT</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}

function splitAnswer(value: string): string[] {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}
