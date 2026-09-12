"use client";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
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
type AuthMode = "login" | "signup" | "verify" | "partnerInfo" | "avatarStyle" | "speechStyle" | "partnerProfile" | "coupleInvite" | "homeCase1" | "homeCase2";
type PartnerGender = "male" | "female";
type AvatarTab = "hair" | "outfit";
type SpeechChoice = "image" | "default";
type SpeechPhoto = { id: string; url: string };

const hairColors = [
  { id: "jetBlack", hex: "#201d1d" },
  { id: "brown", hex: "#64422d" },
  { id: "blue", hex: "#4a92ea" },
  { id: "cream", hex: "#faffd8", outline: true },
  { id: "pink", hex: "#f985ad" },
  { id: "gray", hex: "#f1f1f5", outline: true },
] as const;

const hairStyles = [
  { id: "bangTwin", label: "뱅 트윈번" },
  { id: "bob", label: "단발 보브" },
  { id: "ponytail", label: "포니테일" },
  { id: "wave", label: "물결 롱펌" },
] as const;

const outfitStyles = [
  { id: "outfit1", label: "의상1" },
  { id: "outfit2", label: "의상2" },
  { id: "outfit3", label: "의상3" },
  { id: "outfit4", label: "의상4" },
] as const;

const AVATAR_DEFAULT_COLOR = hairColors[0].id;
const AVATAR_DEFAULT_HAIR = hairStyles[0].id;
const AVATAR_DEFAULT_OUTFIT = outfitStyles[0].id;
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
const PARTNER_PROFILE_FIELD_MAX_LENGTH = 60;
const SPEECH_PHOTO_MAX_COUNT = 4;
type EmailVerifyStatus = "idle" | "pending" | "verified";

function formatBirthDisplay(digits: string) {
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join(".");
}

function getDateDigitsError(digits: string): string | undefined {
  if (digits.length < 8) {
    return undefined;
  }
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    return `연도는 1900~${currentYear}년만 입력할 수 있어요.`;
  }
  if (month < 1 || month > 12) {
    return "월은 01~12 사이로 입력해주세요.";
  }
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return "실제 존재하는 날짜를 입력해주세요.";
  }
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date.getTime() > today.getTime()) {
    return "미래 날짜는 입력할 수 없어요.";
  }
  return undefined;
}

const inviteErrorMessages: Record<string, string> = {
  "You cannot accept your own invitation code.": "본인이 만든 코드는 사용할 수 없어요.",
  "Invitation code is expired or already used.": "만료됐거나 이미 사용된 코드예요. 상대방에게 새 코드를 요청해주세요.",
  "Invitation code was not found.": "존재하지 않는 코드예요. 코드를 다시 확인해주세요.",
  "User already has a couple connection.": "이미 다른 연인과 연결된 계정이에요.",
  "Invitation owner is already connected.": "상대방이 이미 다른 사람과 연결되어 있어요.",
};

function describeInviteError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return inviteErrorMessages[error.message] ?? error.message;
  }
  return fallback;
}

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
  const [partnerName, setPartnerName] = useState("");
  const [partnerGender, setPartnerGender] = useState<PartnerGender | null>(null);
  const [partnerBirthDigits, setPartnerBirthDigits] = useState("");
  const [avatarTab, setAvatarTab] = useState<AvatarTab>("hair");
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_DEFAULT_COLOR);
  const [avatarHair, setAvatarHair] = useState<string>(AVATAR_DEFAULT_HAIR);
  const [avatarOutfit, setAvatarOutfit] = useState<string>(AVATAR_DEFAULT_OUTFIT);
  const [speechChoice, setSpeechChoice] = useState<SpeechChoice | null>(null);
  const [speechPhotos, setSpeechPhotos] = useState<SpeechPhoto[]>([]);
  const [partnerProfileStartedDigits, setPartnerProfileStartedDigits] = useState("");
  const [partnerProfile, setPartnerProfile] = useState({ likes: "", dislikes: "", tendencies: "", habits: "", values: "" });
  const [previewInviteCode, setPreviewInviteCode] = useState("");
  const [showCoupleConnectedPopup, setShowCoupleConnectedPopup] = useState(false);
  const [showMinimiCreatedPopup, setShowMinimiCreatedPopup] = useState(false);
  const [showConsentSheet, setShowConsentSheet] = useState(false);
  const [emailVerifyStatus, setEmailVerifyStatus] = useState<EmailVerifyStatus>("idle");
  const [emailVerifyCode, setEmailVerifyCode] = useState("");
  const [emailVerifyError, setEmailVerifyError] = useState(false);
  const [emailVerifySeconds, setEmailVerifySeconds] = useState(EMAIL_CODE_SECONDS);
  const [me, setMe] = useState<MeData | null>(null);
  const [showCoupleJustConnectedPopup, setShowCoupleJustConnectedPopup] = useState(false);
  const [pending, setPending] = useState(false);
  const [invitation, setInvitation] = useState<PublicInvitation | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [acceptInviteError, setAcceptInviteError] = useState("");
  const [invitationExpired, setInvitationExpired] = useState(false);
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
    terms: false,
    privacyRequired: false,
    processorTransferNotice: false,
    aiAnalysisTransfer: false,
    partnerInfoResponsibility: false,
    age14OrOver: false,
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
          setInvitationExpired(Boolean(payload.data.invitation && Date.parse(payload.data.invitation.expiresAt) <= Date.now()));
        }
      })
      .catch(() => undefined);
  }, [me]);

  useEffect(() => {
    if (!me || me.couple) {
      return;
    }
    let cancelled = false;
    const timer = setInterval(() => {
      fetch("/api/miniu/me", { cache: "no-store" })
        .then((response) => response.json())
        .then((payload: ApiSuccess<MeData> | ApiFailure) => {
          if (!cancelled && payload.ok && payload.data.couple) {
            setMe(payload.data);
            setShowCoupleJustConnectedPopup(true);
          }
        })
        .catch(() => undefined);
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authMessage = params.get("authMessage");
    const authState = params.get("auth");
    if (authMessage) {
      setToast(authMessage);
      if (authState === "verified" || authState === "verify_error") {
        setMode("login");
      }
      params.delete("auth");
      params.delete("authMessage");
      const next = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", next);
    }
  }, []);

  const showPreview = () => setToast("지금은 화면 프리뷰예요. 입력한 내용은 전송·저장되지 않아요.");
  function addSpeechPhotos(files: File[]) {
    if (files.length === 0) {
      return;
    }
    setSpeechPhotos((photos) => {
      const remaining = SPEECH_PHOTO_MAX_COUNT - photos.length;
      if (remaining <= 0) {
        return photos;
      }
      const newPhotos = files
        .slice(0, remaining)
        .map((file) => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, url: URL.createObjectURL(file) }));
      return [...photos, ...newPhotos];
    });
  }
  function removeSpeechPhoto(id: string) {
    setSpeechPhotos((photos) => {
      const target = photos.find((photo) => photo.id === id);
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return photos.filter((photo) => photo.id !== id);
    });
  }
  async function copyInviteCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setToast("코드를 복사했어요.");
    } catch {
      setToast("코드 복사에 실패했어요.");
    }
  }
  function handleBirthDateChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    setBirthDigits(digits);
    const combined = digits.length === 8 && !getDateDigitsError(digits) ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : "";
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
  const birthDateError = getDateDigitsError(birthDigits);
  const partnerBirthDateError = getDateDigitsError(partnerBirthDigits);
  const signupFieldsComplete = Boolean(form.name && form.birthDate && form.email && form.password && passwordsMatch) && !under14 && emailVerifyStatus === "verified";
  const partnerProfileStartedDateError = getDateDigitsError(partnerProfileStartedDigits);
  const partnerProfileComplete = partnerProfileStartedDigits.length === 8 && !partnerProfileStartedDateError && Boolean(partnerProfile.likes.trim() && partnerProfile.dislikes.trim() && partnerProfile.tendencies.trim() && partnerProfile.habits.trim() && partnerProfile.values.trim());

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
      await requestJson<{ user: PublicUser }>("/api/miniu/auth/signup", {
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
      setMode("login");
      setToast("회원가입이 완료됐어요. 이메일 인증 링크를 확인해 주세요.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "회원가입에 실패했어요.");
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
        setToast("이메일 인증이 필요해요. 인증 후 로그인해 주세요.");
        return;
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
      setInvitationExpired(false);
      setToast("초대 코드가 만들어졌어요.");
    } catch (error) {
      setToast(describeInviteError(error, "초대 코드 생성에 실패했어요."));
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
    setAcceptInviteError("");
    try {
      await requestJson<{ couple: MeData["couple"] }>("/api/miniu/invitations/accept", { code: inviteCodeInput });
      await loadMe();
      setInviteCodeInput("");
      setShowCoupleJustConnectedPopup(true);
      setToast("커플 연결이 완료됐어요.");
    } catch (error) {
      setAcceptInviteError(describeInviteError(error, "커플 연결에 실패했어요."));
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
      <AuthShell hideTopBar={mode !== "verify"} mainClassName={mode !== "verify" ? "login-main" : undefined}>
        {mode === "signup" && (
          <div className="login-screen signup-screen">
            <Image src="/login/bg-decor.png" alt="" width={404} height={404} className="login-bg-decor" priority aria-hidden />
            <span className="login-logo text-display-m">MINIU</span>
            <div className="login-card">
              <div className="login-panel signup-panel">
                <AuthHeading title="회원가입" description={"이메일 인증과 필수 동의를\n완료해주세요"} />
                <div className="login-fields signup-fields login-fields--cat">
                  <Image src="/login/cat-peek.png" alt="" width={68} height={68} className="login-fields-cat" aria-hidden />
                  <div className="login-field">
                    <TextField label="닉네임" placeholder="닉네임을 입력해주세요" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
                  </div>
                  <div className="login-field">
                    <TextField label="생년월일" inputMode="numeric" maxLength={10} placeholder="yyyy.mm.dd" value={formatBirthDisplay(birthDigits)} onChange={(event) => handleBirthDateChange(event.target.value)} error={birthDateError ?? (under14 ? "만 14세 미만은 가입할 수 없어요." : undefined)} required />
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
                    <span className="text-label-kr">다음 ▶</span>
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
                        <span className="text-label-kr">가입하기 ▶</span>
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
                <div className="login-fields login-fields--cat">
                  <Image src="/login/cat-peek.png" alt="" width={68} height={68} className="login-fields-cat" aria-hidden />
                  <div className="login-field login-field--email">
                    <TextField label="이메일" type="email" placeholder="이메일을 입력해주세요" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
                  </div>
                  <div className="login-field">
                    <TextField label="비밀번호" type="password" placeholder="비밀번호를 입력해주세요" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
                  </div>
                </div>
                <div className="login-actions">
                  <Button type="submit" fullWidth disabled={pending} className="login-submit">
                    <span className="text-label-kr">로그인 ▶</span>
                  </Button>
                  <button className="login-signup-link text-label-kr" type="button" onClick={() => setMode("signup")}>새 계정 만들기</button>
                  {process.env.NODE_ENV !== "production" && (
                    <button className="auth-link" type="button" onClick={() => setMode("coupleInvite")}>연인 연결 화면 미리보기 (dev)</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
        {mode === "partnerInfo" && (
          <div className="login-screen">
            <Image src="/login/bg-decor.png" alt="" width={404} height={404} className="login-bg-decor" priority aria-hidden />
            <span className="login-logo text-display-m">MINIU</span>
            <div className="login-card">
              <div className="login-panel">
                <AuthHeading title="연인의 정보를 알려주세요" description="기본 정보를 알려주세요" />
                <div className="login-fields">
                  <div className="login-field">
                    <TextField label="이름" placeholder="연인의 이름을 알려주세요" value={partnerName} onChange={(event) => setPartnerName(event.target.value)} required />
                  </div>
                  <div className="login-field">
                    <div className="text-field flex min-w-0 flex-col gap-2 w-full">
                      <label>성별</label>
                      <div className="partner-info-gender">
                        <button type="button" className={partnerGender === "male" ? "partner-info-gender-option is-selected" : "partner-info-gender-option"} onClick={() => setPartnerGender("male")}>남성</button>
                        <button type="button" className={partnerGender === "female" ? "partner-info-gender-option is-selected" : "partner-info-gender-option"} onClick={() => setPartnerGender("female")}>여성</button>
                      </div>
                    </div>
                  </div>
                  <div className="login-field">
                    <TextField label="생년월일" inputMode="numeric" maxLength={10} placeholder="yyyy.mm.dd" value={formatBirthDisplay(partnerBirthDigits)} onChange={(event) => setPartnerBirthDigits(event.target.value.replace(/\D/g, "").slice(0, 8))} error={partnerBirthDateError} required />
                  </div>
                </div>
              </div>
            </div>
            <div className="login-actions">
              <Button type="button" fullWidth disabled={Boolean(partnerBirthDateError)} className="login-submit" onClick={() => setMode("avatarStyle")}>
                <span className="text-label-kr">다음 ▶</span>
              </Button>
              <button className="login-signup-link text-label-kr" type="button" onClick={() => setMode("login")}>로그인으로 돌아가기</button>
            </div>
          </div>
        )}
        {mode === "avatarStyle" && (
          <div className="login-screen avatar-style-screen">
            <Image src="/login/bg-decor.png" alt="" width={404} height={404} className="login-bg-decor" priority aria-hidden />
            <div className="login-topbar">
              <button type="button" className="login-back-button" aria-label="뒤로가기" onClick={() => setMode("partnerInfo")}>
                <Icon name="back" width={20} height={20} />
              </button>
              <span className="login-logo text-display-m">MINIU</span>
            </div>
            <div className="avatar-style-heading">
              <h1>연인 미니미를 꾸며주세요</h1>
              <p>내 연인을 닮은 모습으로 만들어보세요!</p>
            </div>
            <div className="avatar-style-stage">
              <span className="avatar-style-sparkle avatar-style-sparkle--star" aria-hidden>✦</span>
              <Image src="/setup/star.svg" alt="" width={16} height={15} className="avatar-style-sparkle avatar-style-sparkle--svg" aria-hidden />
              <div className="avatar-style-character-crop">
                {/* eslint-disable-next-line @next/next/no-img-element -- percentage crop/zoom needs a plain img, next/image requires fixed intrinsic sizing */}
                <img src="/minimi/partner-preview.png" alt="연인 미니미 미리보기" className="avatar-style-character" />
              </div>
              <Image src="/setup/shadow.svg" alt="" width={104} height={15} className="avatar-style-shadow" aria-hidden />
            </div>
            <div className="avatar-style-panel">
              <div className="avatar-style-tabs-row">
                <div className="avatar-style-tabs">
                  <button type="button" className={avatarTab === "hair" ? "avatar-style-tab is-selected" : "avatar-style-tab"} onClick={() => setAvatarTab("hair")}>헤어</button>
                  <button type="button" className={avatarTab === "outfit" ? "avatar-style-tab is-selected" : "avatar-style-tab"} onClick={() => setAvatarTab("outfit")}>의상</button>
                </div>
                <button type="button" className="avatar-style-reset" onClick={() => { setAvatarColor(AVATAR_DEFAULT_COLOR); setAvatarHair(AVATAR_DEFAULT_HAIR); setAvatarOutfit(AVATAR_DEFAULT_OUTFIT); }}>
                  초기화 <Icon name="refresh" width={14} height={14} />
                </button>
              </div>
              {avatarTab === "hair" && (
                <div className="avatar-style-colors">
                  <span className="avatar-style-colors-label">컬러</span>
                  <div className="avatar-style-colors-list">
                    {hairColors.map((color) => {
                      const isSelected = avatarColor === color.id;
                      const shadows: string[] = [];
                      if ("outline" in color) shadows.push("inset 0 0 0 1px var(--color-border-secondary)");
                      if (isSelected) shadows.push("0 0 0 2px var(--color-common-100)", "0 0 0 4px #22d3ee");
                      return (
                        <button
                          key={color.id}
                          type="button"
                          aria-label={color.id}
                          className={isSelected ? "avatar-style-color is-selected" : "avatar-style-color"}
                          style={{ background: color.hex, boxShadow: shadows.length ? shadows.join(", ") : undefined }}
                          onClick={() => setAvatarColor(color.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              {avatarTab === "hair" ? (
                <div className="avatar-style-grid">
                  {hairStyles.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      className={avatarHair === style.id ? "avatar-style-card is-selected" : "avatar-style-card"}
                      onClick={() => setAvatarHair(style.id)}
                    >
                      <span className="avatar-style-card-thumb" aria-hidden />
                      <span className="avatar-style-card-label">{style.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="avatar-style-grid">
                  {outfitStyles.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      className={avatarOutfit === style.id ? "avatar-style-card is-selected" : "avatar-style-card"}
                      onClick={() => setAvatarOutfit(style.id)}
                    >
                      <span className="avatar-style-card-thumb" aria-hidden />
                      <span className="avatar-style-card-label">{style.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="login-actions">
              <Button type="button" fullWidth className="login-submit" onClick={() => setMode("speechStyle")}>
                <span className="text-label-kr">다음 ▶</span>
              </Button>
              <button className="login-signup-link text-label-kr" type="button" onClick={() => setMode("partnerInfo")}>이전으로 돌아가기</button>
            </div>
          </div>
        )}
        {mode === "speechStyle" && (
          <div className="login-screen">
            <Image src="/login/bg-decor.png" alt="" width={404} height={404} className="login-bg-decor" priority aria-hidden />
            <div className="login-topbar">
              <button type="button" className="login-back-button" aria-label="뒤로가기" onClick={() => setMode("avatarStyle")}>
                <Icon name="back" width={20} height={20} />
              </button>
              <span className="login-logo text-display-m">MINIU</span>
            </div>
            <div className="step-heading">
              <h1>연인의 말투는 어떤가요?</h1>
              <p>최근 나눈 대화를 살짝 보여주세요</p>
            </div>
            <div className="step-options step-options--wide">
              <div className="step-option-group">
                <div className={speechChoice === "image" ? "step-option-card is-selected" : "step-option-card"}>
                  <button type="button" className="step-option-row" onClick={() => setSpeechChoice("image")}>
                    <Icon name="image" width={24} height={24} />
                    <span className="step-option-text">
                      <span className="step-option-title">이미지 업로드</span>
                      <span className="step-option-desc">카카오톡, 문자, DM 캡쳐 등</span>
                    </span>
                  </button>
                  {speechChoice === "image" && (
                    <div className="step-photos">
                      <div className="step-photos-row">
                        {speechPhotos.map((photo) => (
                          <div key={photo.id} className="step-photo-thumb">
                            {/* eslint-disable-next-line @next/next/no-img-element -- user-selected blob: URL, not a static asset next/image can optimize */}
                            <img src={photo.url} alt="" className="step-photo-thumb-img" />
                            <button type="button" className="step-photo-remove" aria-label="사진 삭제" onClick={() => removeSpeechPhoto(photo.id)}>
                              <Icon name="close" width={14} height={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      {speechPhotos.length < SPEECH_PHOTO_MAX_COUNT && (
                        <label className="step-photos-add">
                          + 사진 추가 ({speechPhotos.length}/{SPEECH_PHOTO_MAX_COUNT})
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            onChange={(event) => {
                              const files = event.target.files ? Array.from(event.target.files) : [];
                              event.target.value = "";
                              addSpeechPhotos(files);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}
                </div>
                <p className="step-option-caption step-option-caption--inset">*말투를 학습하는 데만 사용되며, 학습이 끝나면 바로 삭제돼요.</p>
              </div>
              <div className={speechChoice === "default" ? "step-option-card is-selected" : "step-option-card"}>
                <button type="button" className="step-option-row" onClick={() => setSpeechChoice("default")}>
                  <Image src="/setup/android.svg" alt="" width={24} height={24} aria-hidden />
                  <span className="step-option-text">
                    <span className="step-option-title">기본 말투로 설정</span>
                    <span className="step-option-desc">보여줄 대화가 없다면 선택</span>
                  </span>
                </button>
              </div>
            </div>
            <div className="login-actions">
              <Button type="button" fullWidth className="login-submit" disabled={!speechChoice || (speechChoice === "image" && speechPhotos.length === 0)} onClick={() => setMode("partnerProfile")}>
                <span className="text-label-kr">다음 ▶</span>
              </Button>
              <button className="login-signup-link text-label-kr" type="button" onClick={() => setMode("avatarStyle")}>이전으로 돌아가기</button>
            </div>
          </div>
        )}
        {mode === "partnerProfile" && (
          <div className="login-screen">
            <Image src="/login/bg-decor.png" alt="" width={404} height={404} className="login-bg-decor" priority aria-hidden />
            <div className="login-topbar">
              <button type="button" className="login-back-button" aria-label="뒤로가기" onClick={() => setMode("speechStyle")}>
                <Icon name="back" width={20} height={20} />
              </button>
              <span className="login-logo text-display-m">MINIU</span>
            </div>
            <div className="step-heading">
              <h1>내 연인은 어떤 사람일까요?</h1>
              <p>사전 질문에 답해주시면 먼저 기억해둘게요!</p>
            </div>
            <div className="login-fields step-fields">
              <div className="login-field">
                <TextField label="사귄 날짜" inputMode="numeric" maxLength={10} placeholder="yyyy.mm.dd" value={formatBirthDisplay(partnerProfileStartedDigits)} onChange={(event) => setPartnerProfileStartedDigits(event.target.value.replace(/\D/g, "").slice(0, 8))} error={partnerProfileStartedDateError} />
              </div>
              <AutoGrowField label="좋아하는 것" placeholder="예: 산책, 아이스 아메리카노" value={partnerProfile.likes} maxLength={PARTNER_PROFILE_FIELD_MAX_LENGTH} onChange={(value) => setPartnerProfile({ ...partnerProfile, likes: value })} />
              <AutoGrowField label="싫어하는 것" placeholder="예: 갑작스러운 일정 변경, 민초" value={partnerProfile.dislikes} maxLength={PARTNER_PROFILE_FIELD_MAX_LENGTH} onChange={(value) => setPartnerProfile({ ...partnerProfile, dislikes: value })} />
              <AutoGrowField label="평소 성향" placeholder="예: 낯가림이 있지만 친해지면 장난이 많음" value={partnerProfile.tendencies} maxLength={PARTNER_PROFILE_FIELD_MAX_LENGTH} onChange={(value) => setPartnerProfile({ ...partnerProfile, tendencies: value })} />
              <AutoGrowField label="자주 하는 습관" placeholder="예: 자기 전에 음악을 듣는다" value={partnerProfile.habits} maxLength={PARTNER_PROFILE_FIELD_MAX_LENGTH} onChange={(value) => setPartnerProfile({ ...partnerProfile, habits: value })} />
              <AutoGrowField label="가치관" placeholder="예: 약속을 지키는 것" value={partnerProfile.values} maxLength={PARTNER_PROFILE_FIELD_MAX_LENGTH} onChange={(value) => setPartnerProfile({ ...partnerProfile, values: value })} />
            </div>
            <p className="step-option-caption step-fields-caption">
              답변은 초기 프로필 카드와 D-day 기준이 됩니다.<br />
              연인이 원치 않을 민감한 정보나 다른 사람의 정보는 넣지 마세요.
            </p>
            <div className="login-actions">
              <Button type="button" fullWidth className="login-submit" disabled={!partnerProfileComplete} onClick={() => setShowMinimiCreatedPopup(true)}>
                <span className="text-label-kr">다음 ▶</span>
              </Button>
              <button className="login-signup-link text-label-kr" type="button" onClick={() => setMode("speechStyle")}>이전으로 돌아가기</button>
            </div>
            {showMinimiCreatedPopup && (
              <div className="popup-dimmed">
                <div className="popup-alert">
                  <div className="popup-alert-text">
                    <p className="popup-alert-title">연인 미니미가 생성됐어요!</p>
                    <p className="popup-alert-desc">이제 미니미와 함께 연인을 알아가봐요</p>
                  </div>
                  <div className="popup-alert-actions">
                    <Button type="button" fullWidth className="login-submit" onClick={() => { setShowMinimiCreatedPopup(false); setMode("login"); }}>
                      <span className="text-label-kr">확인 ▶</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {mode === "coupleInvite" && (
          <div className="login-screen">
            <Image src="/login/bg-decor.png" alt="" width={404} height={404} className="login-bg-decor" priority aria-hidden />
            <div className="login-logo-row">
              <span className="login-logo text-display-m">MINIU</span>
              <button type="button" className="login-logo-close" aria-label="닫기" onClick={() => setMode("homeCase1")}>
                <Icon name="close" width={20} height={20} />
              </button>
            </div>
            <div className="step-heading">
              <h1>연인과 연결해주세요!</h1>
              <p>아래 코드를 공유하거나 상대방 코드를 입력해주세요</p>
            </div>
            <div className="step-options">
              <div className="step-option-card step-option-card--invite">
                <Image src="/setup/code.svg" alt="" width={24} height={24} aria-hidden />
                <span className="step-option-text">
                  <span className="step-option-title">내 초대 코드</span>
                  <span className="step-invite-code-row">
                    <span className="step-invite-code">K7M2QP9A</span>
                    <button type="button" className="step-invite-chip" onClick={() => copyInviteCode("K7M2QP9A")}>
                      코드복사 <Icon name="copy" width={14} height={14} />
                    </button>
                  </span>
                </span>
              </div>
              <div className="step-option-card step-option-card--invite">
                <Image src="/setup/code.svg" alt="" width={24} height={24} aria-hidden />
                <span className="step-option-text step-option-text--gap-sm">
                  <span className="step-option-title">받은 코드로 입력</span>
                  <span className="step-invite-input-row">
                    <input className="step-invite-input" placeholder="예 : K7M2QP9A" maxLength={8} value={previewInviteCode} onChange={(event) => setPreviewInviteCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} />
                  </span>
                </span>
              </div>
            </div>
            <p className="step-option-caption step-option-caption--left">대화는 말투를 학습하는 데만 사용되며,<br />학습이 끝나면 바로 삭제돼요.</p>
            <div className="login-actions">
              <Button type="button" fullWidth className="login-submit" onClick={() => setShowCoupleConnectedPopup(true)}>
                <span className="text-label-kr">완료 ▶</span>
              </Button>
              <button className="login-signup-link text-label-kr" type="button" onClick={() => setMode("homeCase1")}>홈 먼저 둘러보기</button>
            </div>
            {showCoupleConnectedPopup && (
              <div className="popup-dimmed">
                <div className="popup-alert">
                  <div className="popup-alert-text">
                    <p className="popup-alert-title">연결이 완료됐어요!</p>
                    <p className="popup-alert-desc">이제 연인 미니미를 생성해보세요</p>
                  </div>
                  <div className="popup-alert-actions">
                    <Button type="button" fullWidth className="login-submit" onClick={() => { setShowCoupleConnectedPopup(false); setMode("homeCase2"); }}>
                      <span className="text-label-kr">확인 ▶</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {mode === "homeCase1" && (
          <HomeCasePreview
            bubbleLines={["\"아직 커플 연결이 안됐네냥", "얼른 연결해주라냥!\""]}
            statusText="커플 연결 대기 중..."
            actionLabel="커플 연결하기"
            onAction={() => setMode("coupleInvite")}
            onNavHome={() => setMode("homeCase1")}
          />
        )}
        {mode === "homeCase2" && (
          <HomeCasePreview
            bubbleLines={["\"아직 미니미 생성이 안됐네냥", "얼른 만들어주라냥!\""]}
            statusText="미니미 생성 준비 중..."
            actionLabel="연인 미니미 만들기"
            onAction={() => setMode("partnerInfo")}
            onNavHome={() => setMode("homeCase2")}
          />
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
          invitationExpired={invitationExpired}
          inviteCodeInput={inviteCodeInput}
          acceptError={acceptInviteError}
          pending={pending}
          onInviteCodeChange={(value) => { setInviteCodeInput(value); setAcceptInviteError(""); }}
          onCreateInvitation={createInvitation}
          onAcceptInvitation={acceptInvitation}
          onContinue={continueToPreQuestions}
        />
        {showCoupleJustConnectedPopup && <CoupleConnectedPopup onClose={() => setShowCoupleJustConnectedPopup(false)} />}
        <Toast message={toast} onDismiss={() => setToast("")} />
      </AuthShell>
    );
  }

  if (me.user.onboardingStep === "preQuestions" || me.onboarding.needsPreQuestions) {
    return (
      <AuthShell user={user} onLogout={logout}>
        <PreQuestionStep values={preQuestions} pending={pending} onChange={setPreQuestions} onSubmit={submitPreQuestions} />
        {showCoupleJustConnectedPopup && <CoupleConnectedPopup onClose={() => setShowCoupleJustConnectedPopup(false)} />}
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
      {showCoupleJustConnectedPopup && <CoupleConnectedPopup onClose={() => setShowCoupleJustConnectedPopup(false)} />}
      <Toast message={toast} onDismiss={() => setToast("")} />
    </MobileShell>
  );
}

function CoupleLinkStep({
  invitation,
  inviteLink,
  invitationExpired,
  inviteCodeInput,
  acceptError,
  pending,
  onInviteCodeChange,
  onCreateInvitation,
  onAcceptInvitation,
  onContinue,
}: {
  invitation: PublicInvitation | null;
  inviteLink: string;
  invitationExpired: boolean;
  inviteCodeInput: string;
  acceptError: string;
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
        <span>내 초대 코드{invitationExpired && " (만료됨)"}</span>
        <strong>{invitation && !invitationExpired ? invitation.codePreview : "아직 없음"}</strong>
        {inviteLink && !invitationExpired && <p>{inviteLink}</p>}
        {invitationExpired && <p>코드가 만료됐어요. 새로 만들어서 다시 공유해주세요.</p>}
        <Button type="button" fullWidth onClick={onCreateInvitation} disabled={pending}>{invitation && !invitationExpired ? "초대 코드 다시 만들기" : "초대 코드 만들기"}</Button>
      </Surface>
      <form className="onboarding-card onboarding-card--form" onSubmit={onAcceptInvitation}>
        <TextField label="받은 초대 코드" value={inviteCodeInput} onChange={(event) => onInviteCodeChange(event.target.value)} placeholder="예: K7M2QP9A" error={acceptError || undefined} />
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

function HomeCaseNotificationBell() {
  return (
    <div className="home-case-bell" aria-hidden>
      <span style={{ position: "absolute", inset: "8.33% 37.5% 83.33% 37.5%" }} />
      <span style={{ position: "absolute", bottom: "75%", left: "29.17%", right: "62.5%", top: "16.67%" }} />
      <span style={{ position: "absolute", bottom: "75%", left: "62.5%", right: "29.17%", top: "16.67%" }} />
      <span style={{ position: "absolute", bottom: "45.83%", left: "20.83%", right: "70.83%", top: "25%" }} />
      <span style={{ position: "absolute", bottom: "45.83%", left: "70.83%", right: "20.83%", top: "25%" }} />
      <span style={{ position: "absolute", inset: "54.17% 79.17% 29.17% 12.5%" }} />
      <span style={{ position: "absolute", inset: "54.17% 12.5% 29.17% 79.17%" }} />
      <span style={{ position: "absolute", inset: "62.5% 12.5% 29.17% 12.5%" }} />
      <span style={{ position: "absolute", bottom: "16.67%", left: "33.33%", right: "58.33%", top: "75%" }} />
      <span style={{ position: "absolute", bottom: "16.67%", left: "58.33%", right: "33.33%", top: "75%" }} />
      <span style={{ position: "absolute", inset: "83.33% 33.33% 8.33% 33.33%" }} />
    </div>
  );
}

function HomeCasePreview({ bubbleLines, statusText, actionLabel, onAction, onNavHome }: { bubbleLines: string[]; statusText: string; actionLabel: string; onAction: () => void; onNavHome: () => void }) {
  return (
    <div className="home-case-screen">
      <Image src="/login/bg-decor.png" alt="" width={404} height={404} className="login-bg-decor" priority aria-hidden />
      <div className="home-case-topbar">
        <span className="home-case-logo text-display-m">MINIU</span>
        <div className="home-case-topbar-icons">
          <HomeCaseNotificationBell />
          <div className="home-case-gear-crop" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element -- percentage crop/zoom matching Figma's own technique, next/image requires fixed intrinsic sizing */}
            <img src="/home/gear.png" alt="" className="home-case-gear-img" />
          </div>
        </div>
      </div>
      <div className="home-case-window">
        <div className="home-case-titlebar">
          <span className="home-case-titlebar-text">jisoo_cam.exe - [Live Garden Stage]</span>
          <div className="home-case-winbuttons">
            <span className="home-case-winbtn"><Image src="/home/win-btn-1.svg" alt="" width={10} height={10} /></span>
            <Image src="/home/win-btn-2.svg" alt="" width={16} height={16} className="home-case-winbtn-plain" />
            <span className="home-case-winbtn"><Image src="/home/win-btn-3.svg" alt="" width={10} height={10} /></span>
          </div>
        </div>
        <div className="home-case-menustrip">
          <span>파일(F)</span>
          <span>동작(A)</span>
          <span>보기(V)</span>
          <span>도움말(H)</span>
        </div>
        <div className="home-case-photo-wrap">
          <div className="home-case-stage">
            <Image src="/home/garden-bg.png" alt="" width={342} height={233} className="home-case-garden-bg" />
            <div className="home-case-scene">
              <div className="home-case-bubble">
                {bubbleLines.map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
                <span className="home-case-bubble-tail">▼</span>
              </div>
              <div className="home-case-character">
                <Image src="/setup/shadow.svg" alt="" width={104} height={15} className="home-case-character-shadow" aria-hidden />
                <div className="home-case-character-crop">
                  {/* eslint-disable-next-line @next/next/no-img-element -- percentage crop/zoom matching Figma's own technique, next/image requires fixed intrinsic sizing */}
                  <img src="/home/minimi-cat.png" alt="" className="home-case-character-img" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="home-case-underbar">{statusText}</div>
      </div>
      <button type="button" className="home-case-action-banner" onClick={onAction}>
        <span>{actionLabel}</span>
        <span className="home-case-action-chevron">▼</span>
      </button>
      <div className="home-case-nav">
        <button type="button" className="home-case-nav-item is-active" onClick={onNavHome}>
          <Image src="/home/nav-home.png" alt="" width={46} height={46} />
          <span>홈</span>
        </button>
        <button type="button" className="home-case-nav-item" onClick={onNavHome}>
          <Image src="/home/nav-record.png" alt="" width={46} height={46} />
          <span>기록</span>
        </button>
        <button type="button" className="home-case-nav-item" onClick={onNavHome}>
          <Image src="/home/nav-profile.png" alt="" width={46} height={46} />
          <span>프로필</span>
        </button>
      </div>
    </div>
  );
}

function CoupleConnectedPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="popup-dimmed">
      <div className="popup-alert">
        <div className="popup-alert-text">
          <p className="popup-alert-title">연결이 완료됐어요!</p>
          <p className="popup-alert-desc">이제 연인 미니미를 생성해보세요</p>
        </div>
        <div className="popup-alert-actions">
          <Button type="button" fullWidth className="login-submit" onClick={onClose}>
            <span className="text-label-kr">확인 ▶</span>
          </Button>
        </div>
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

function AutoGrowField({ label, placeholder, value, onChange, maxLength }: { label: string; placeholder: string; value: string; onChange: (value: string) => void; maxLength: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);
  return (
    <div className="login-field">
      <div className="text-field flex min-w-0 flex-col gap-2 w-full">
        <label>{label}</label>
        <textarea ref={ref} rows={1} className="step-textarea" placeholder={placeholder} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
      </div>
    </div>
  );
}

function splitAnswer(value: string): string[] {
  return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}
