"use client";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { PreviewTab } from "@/shared/config/design-system";
import { Button } from "@/shared/ui/button";
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
type AuthMode = "login" | "signup";
type PreQuestionKey = "likes" | "dislikes" | "tendencies" | "habits" | "values";

const requiredConsentItems = [
  {
    id: "terms",
    label: "[필수] 미니유 서비스 이용약관에 동의합니다.",
    detail: "서비스 제공 범위, 회원 의무, 금지 행위, 기록 관리, 서비스 변경·중단, 계약 해지, 회원 탈퇴, 책임 한계, 준거법과 관할을 확인합니다. 연인 등 제3자 정보를 입력할 때 정당한 권한을 갖추고 필요한 경우 동의를 받을 책임도 포함됩니다.",
  },
  {
    id: "privacyRequired",
    label: "[필수] 개인정보 수집·이용에 동의합니다.",
    detail: "회원 식별·인증, 이메일 인증, 연령 확인, 커플 연결, 기록·프로필·채팅·문자 기능 제공, 보안과 장애 대응을 위해 이메일, 비밀번호, 닉네임, 생년월일, 커플 연결 정보, 서비스 이용기록을 처리합니다. 보유 기간은 회원 탈퇴 후 30일까지를 기본으로 합니다.",
  },
  {
    id: "processorTransferNotice",
    label: "[필수] 개인정보 처리위탁 및 국외 이전 안내를 확인했습니다.",
    detail: "서비스 서버·DB·스토리지 운영, 가입 인증 메일 발송, 기록·문자·대화 캡처의 AI 분석을 외부 사업자에게 위탁할 수 있고, 일부 정보는 국외에서 처리될 수 있습니다. 실제 수탁사·국가·보유기간은 계약 확정 후 처리방침에 반영됩니다.",
  },
  {
    id: "aiAnalysisTransfer",
    label: "[필수] 대화·캡처의 AI 분석 및 국외 이전에 동의합니다.",
    detail: "말투 설정과 AI 채팅 이용 시 사용자가 입력한 대화 내용, 대화 캡처 이미지, 말투 요약 결과가 국외 AI 처리 사업자에게 전송·처리될 수 있습니다. 대화 캡처 원본은 분석 직후 삭제하며, 캡처를 올리지 않으면 기본 말투로 동작합니다.",
  },
  {
    id: "partnerInfoResponsibility",
    label: "[필수] 연인 정보 입력 책임과 민감정보 미입력을 확인했습니다.",
    detail: "연인의 이름·닉네임, 취향, 습관, 성향, 가치관, 일상 정보, 대화 내용과 이를 바탕으로 AI가 만든 프로필 카드·말투 요약이 처리될 수 있습니다. 건강, 종교, 정치적 견해, 성생활 등 민감한 정보나 연인이 원치 않는 내용은 입력하지 않아야 하며, 연인은 삭제·처리정지를 요청할 수 있습니다.",
  },
  {
    id: "age14OrOver",
    label: "[필수] 만 14세 이상입니다.",
    detail: "미니유는 만 14세 미만 아동의 가입을 받지 않습니다. 생년월일로 만 14세 미만으로 확인되면 회원가입이 차단됩니다.",
  },
] as const;

const marketingConsent = {
  label: "[선택] 마케팅·광고성 정보 수신에 동의합니다.",
  detail: "이벤트, 혜택, 신규 기능 안내 등 광고성 정보를 이메일로 받을 수 있습니다. 동의하지 않아도 가입과 핵심 서비스 이용에는 제한이 없고, 언제든 철회할 수 있습니다.",
};

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
  const [me, setMe] = useState<MeData | null>(null);
  const [pending, setPending] = useState(false);
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
        }
      })
      .catch(() => undefined);
  }, [me]);

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
      <AuthShell>
        {mode === "signup" && (
          <form className="auth-panel" onSubmit={submitSignup}>
            <AuthHeading title="회원가입" description="이메일 인증과 필수 동의까지 완료해야 MINIU를 사용할 수 있어요." />
            <TextField label="닉네임" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            <TextField label="생년월일" type="date" value={form.birthDate} onChange={(event) => setForm({ ...form, birthDate: event.target.value })} error={under14 ? "만 14세 미만은 가입할 수 없어요." : undefined} required />
            <TextField label="이메일" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            <TextField label="비밀번호" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} hint="8~16자, 숫자와 특수문자 포함" required />
            <Surface className="auth-consents">
              <label className="auth-check auth-check--all">
                <input
                  type="checkbox"
                  checked={allRequiredChecked && form.marketing}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setForm({ ...form, terms: checked, privacyRequired: checked, processorTransferNotice: checked, aiAnalysisTransfer: checked, partnerInfoResponsibility: checked, age14OrOver: checked, marketing: checked });
                  }}
                />
                <span>전체 동의합니다</span>
              </label>
              {requiredConsentItems.map((item) => (
                <ConsentItem key={item.id} checked={form[item.id]} label={item.label} detail={item.detail} onChange={(checked) => setForm({ ...form, [item.id]: checked })} />
              ))}
              <ConsentItem checked={form.marketing} label={marketingConsent.label} detail={marketingConsent.detail} onChange={(checked) => setForm({ ...form, marketing: checked })} />
            </Surface>
            <Button type="submit" fullWidth disabled={pending || !allRequiredChecked || under14}>가입하고 인증하기</Button>
            <button className="auth-link" type="button" onClick={() => setMode("login")}>이미 계정이 있어요</button>
          </form>
        )}
        {mode === "login" && (
          <form className="auth-panel" onSubmit={submitLogin}>
            <AuthHeading title="로그인" description="이메일 인증을 마친 계정만 로그인할 수 있어요." />
            <TextField label="이메일" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            <TextField label="비밀번호" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
            <Button type="submit" fullWidth disabled={pending}>로그인</Button>
            <button className="auth-link" type="button" onClick={() => setMode("signup")}>새 계정 만들기</button>
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

function ConsentItem({ checked, label, detail, onChange }: { checked: boolean; label: string; detail: string; onChange: (checked: boolean) => void }) {
  return (
    <div className="auth-consent-item">
      <label className="auth-check">
        <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span>{label}</span>
      </label>
      <details className="auth-consent-detail">
        <summary>내용 보기</summary>
        <p>{detail}</p>
      </details>
    </div>
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

function AuthShell({ children, user, onLogout }: { children: ReactNode; user?: PublicUser; onLogout?: () => void }) {
  return (
    <div className="site-frame">
      <div className="mobile-shell auth-shell">
        <header className="top-bar">
          <span className="wordmark">miniu<span className="wordmark-dot">◆</span></span>
          {user ? <button className="top-bar-link" type="button" onClick={onLogout}>로그아웃</button> : <span className="top-bar-caption">이메일 인증 가입</span>}
        </header>
        <main>{children}</main>
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
