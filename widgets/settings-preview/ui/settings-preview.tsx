"use client";

import { useEffect, useState } from "react";
import {
  MiniuApiError,
  deleteAccount,
  getHouse,
  getPreQuestions,
  listNotificationSettings,
  unlinkCouple,
  updateNotificationSettings,
  type NotificationSetting,
} from "@/shared/api/miniu";
import { ButtonPopup } from "@/shared/ui/pixel-button";

type SettingsView = "list" | "notifications" | "couple";
type SettingsPopup = "logout" | "disconnect" | "delete" | null;

// 백엔드에 이미 정의된 4가지 알림 타입(app/lib/miniu/notifications.ts)에 맞춘 라벨.
// 프론트 전용 작업 범위라 새 알림 타입을 추가하지 않고 기존 타입만 노출한다.
const NOTIFICATION_ORDER = ["couple_connected", "affection_received", "letter_received", "profile_merge_candidate"] as const;
const NOTIFICATION_LABELS: Record<string, string> = {
  couple_connected: "커플 연결 알림",
  affection_received: "애정 표현 알림",
  letter_received: "문자 도착 알림",
  profile_merge_candidate: "새 프로필 조각 알림",
};

// 라벨 끝 글자에 받침이 있으면 "을", 없으면 "를"(한글이 아니면 "를"로 기본값).
function withObjectParticle(label: string): string {
  const lastChar = label.trim().slice(-1);
  const code = lastChar.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) {
    return `${label}를`;
  }
  const hasFinalConsonant = (code - 0xac00) % 28 !== 0;
  return `${label}${hasFinalConsonant ? "을" : "를"}`;
}

function calcDDay(startedOn: string | null): number | null {
  if (!startedOn) return null;
  const start = new Date(`${startedOn}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
}

function describeApiError(error: unknown): string {
  if (error instanceof MiniuApiError) {
    if (error.status === 401) return "로그인이 필요해요.";
    if (error.status === 403) return "연인과 연결해 주세요.";
    return error.message;
  }
  return "잠시 후 다시 시도해 주세요.";
}

const DIALOG_BASE =
  "flex flex-col items-stretch w-full max-w-[358px] bg-[#d8dee9] border-2 border-white shadow-[2px_2px_0px_0px_rgba(17,17,17,0.2)]";

function ConfirmDialog({ lines, primaryLabel, onConfirm, onCancel }: { lines: string[]; primaryLabel: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-[#111] opacity-80 z-20 cursor-pointer" onClick={onCancel} aria-hidden="true" />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[21] w-[358px] max-w-[calc(100%-32px)]" role="dialog" aria-modal="true">
        <div className={DIALOG_BASE}>
          <div className="flex flex-col items-center gap-2 px-2 py-5">
            <div className="m-0 text-center font-pixel text-base tracking-[0.16px] leading-[1.5] text-[#191f28] [&_p]:m-0">
              {lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
          <ButtonPopup primaryLabel={primaryLabel} secondaryLabel="취소" onPrimaryClick={onConfirm} onSecondaryClick={onCancel} />
        </div>
      </div>
    </>
  );
}

// Figma node 203:60667 (Toggle) 기반, 트랙 radius는 10px, 16px 원형 썸, on 색상은 민트(#22d3ee).
// globals.css의 `button { border-radius: 0 }`가 unlayered라 버튼 자체에 준 rounded-[10px]가
// 씹혀서(§15.3과 동일한 종류의 캐스케이드 함정), 트랙 모양은 버튼이 아닌 자식 span에 둔다.
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className="relative shrink-0 w-[38px] h-[22px] border-0 bg-transparent p-0 cursor-pointer">
      <span
        className={`absolute inset-0 rounded-[10px] transition-colors duration-[120ms] ease-[steps(2,end)] ${checked ? "bg-[#22d3ee]" : "bg-[#d1d6db]"}`}
      />
      <span
        className={`absolute top-1/2 left-[3px] -translate-y-1/2 w-4 h-4 rounded-full bg-white transition-transform duration-[120ms] ease-[steps(2,end)] ${
          checked ? "translate-x-[16px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SettingsHeader({ onBack }: { onBack?: () => void }) {
  return (
    <div className="relative flex items-center h-[59px] px-4">
      <button type="button" onClick={onBack} aria-label="뒤로가기" className="flex items-center justify-center border-0 bg-transparent p-0 cursor-pointer">
        <img src="/terms/chevron-left.svg" alt="" width={28} height={28} style={{ filter: "brightness(0) invert(1)" }} />
      </button>
    </div>
  );
}

function SettingsRow({ label, onClick, muted }: { label: string; onClick?: () => void; muted?: boolean }) {
  // globals.css의 `button { font: inherit; color: inherit }`가 unlayered라 Tailwind의
  // font-pixel/text-color 유틸리티보다 캐스케이드 우선순위가 높아, 버튼 자체에 준 클래스가
  // 씹힌다(§15.3). 버튼이 아닌 자식 span에 타이포/색상을 준다.
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-6 w-full py-0 m-0 border-none bg-transparent text-left cursor-pointer">
      <span className={`flex-1 min-w-0 font-pixel text-base tracking-[0.16px] ${muted ? "text-[#6b7684]" : "text-[#191f28]"}`}>{label}</span>
      {onClick && !muted ? <img src="/icons/chevron-right.svg" alt="" width={20} height={20} aria-hidden="true" /> : null}
    </button>
  );
}

export function SettingsPreview({
  onBack,
  onLogout,
  onAccountDeleted,
  devMock,
}: {
  onBack?: () => void;
  onLogout?: () => void;
  onAccountDeleted?: () => void;
  /** 개발용: 백엔드 호출 없이 연인/알림 설정을 목업 데이터로 바로 보여줄 때만 사용. */
  devMock?: { partnerName: string; dDay: number | null; connected: boolean };
}) {
  const [view, setView] = useState<SettingsView>("list");
  const [popup, setPopup] = useState<SettingsPopup>(null);
  const [partnerName, setPartnerName] = useState(devMock?.partnerName ?? "연인");
  const [dDay, setDDay] = useState<number | null>(devMock?.dDay ?? null);
  const [connected, setConnected] = useState(devMock ? devMock.connected : true);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>(
    devMock ? NOTIFICATION_ORDER.map((type) => ({ type, enabled: true, updatedAt: new Date().toISOString() })) : [],
  );
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [notificationsLoaded, setNotificationsLoaded] = useState(Boolean(devMock));

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 2500);
  }

  useEffect(() => {
    if (devMock) return;
    let cancelled = false;
    Promise.all([getHouse(), getPreQuestions()])
      .then(([house, { preQuestions }]) => {
        if (cancelled) return;
        setConnected(Boolean(house.partner.miniu));
        if (house.partner.miniu) setPartnerName(house.partner.miniu.name);
        if (preQuestions) setDDay(calcDDay(preQuestions.relationshipStartedOn));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [devMock]);

  useEffect(() => {
    if (devMock || view !== "notifications" || notificationsLoaded) return;
    let cancelled = false;
    listNotificationSettings()
      .then(({ settings }) => {
        if (!cancelled) {
          setNotificationSettings(settings);
          setNotificationsLoaded(true);
        }
      })
      .catch((error) => {
        if (!cancelled) setActionError(describeApiError(error));
      });
    return () => {
      cancelled = true;
    };
  }, [devMock, view, notificationsLoaded]);

  function toggleNotification(type: string) {
    const current = notificationSettings.find((item) => item.type === type);
    const nextEnabled = !current?.enabled;
    setNotificationSettings((prev) => prev.map((item) => (item.type === type ? { ...item, enabled: nextEnabled } : item)));
    showNotice(`${withObjectParticle(NOTIFICATION_LABELS[type])} ${nextEnabled ? "켰어요." : "껐어요."}`);
    if (devMock) return;
    updateNotificationSettings({ [type]: nextEnabled }).catch((error) => {
      setNotificationSettings((prev) => prev.map((item) => (item.type === type ? { ...item, enabled: !nextEnabled } : item)));
      setActionError(describeApiError(error));
    });
  }

  async function confirmLogout() {
    setPopup(null);
    onLogout?.();
  }

  async function confirmDisconnect() {
    setPopup(null);
    if (devMock) {
      setConnected(false);
      setView("list");
      showNotice("커플 연결이 해제됐어요.");
      return;
    }
    try {
      await unlinkCouple();
      setConnected(false);
      setView("list");
      showNotice("커플 연결이 해제됐어요.");
    } catch (error) {
      setActionError(describeApiError(error));
    }
  }

  async function confirmDelete() {
    setPopup(null);
    if (devMock) {
      showNotice("계정이 삭제됐어요.");
      return;
    }
    try {
      await deleteAccount();
      showNotice("계정이 삭제됐어요.");
      onAccountDeleted?.();
    } catch (error) {
      setActionError(describeApiError(error));
    }
  }

  return (
    <div className="relative flex flex-col h-dvh w-full bg-gradient-to-b from-[#7cb6f6] via-[#e9f9ff] to-white text-[#191f28]">
      <div className="absolute inset-x-0 top-0 h-[404px] overflow-hidden pointer-events-none" aria-hidden="true">
        <img className="absolute left-[-7px] top-[-3px] w-[404px] h-[404px] object-cover mix-blend-soft-light opacity-30 rotate-180" src="/minimi/bg-soft-light.png" alt="" />
      </div>

      <SettingsHeader onBack={view === "list" ? onBack : () => setView("list")} />

      {actionError ? <p className="relative mx-4 mt-2 font-pixel text-xs text-[#db2777]">{actionError}</p> : null}

      {view === "list" ? (
        <div className="relative flex flex-col gap-10 mt-6 overflow-y-auto pb-10">
          <div className="px-4">
            <p className="m-0 font-pixel text-[22px] tracking-[-0.55px] leading-[1.36] text-[#191f28]">설정</p>
          </div>

          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-2.5 px-4">
              <p className="m-0 font-pixel text-xs tracking-[0.3px] text-[#6b7684]">알림</p>
              <div className="flex flex-col gap-6">
                <SettingsRow label="알림 설정" onClick={() => setView("notifications")} />
              </div>
            </div>

            <div className="flex flex-col gap-2.5 px-4">
              <p className="m-0 font-pixel text-xs tracking-[0.3px] text-[#6b7684]">계정 관리</p>
              <div className="flex flex-col gap-6">
                <SettingsRow label="커플 연결" onClick={() => setView("couple")} />
                <SettingsRow label="계정 삭제" onClick={() => setPopup("delete")} />
              </div>
            </div>

            <div className="px-4">
              <SettingsRow label="로그아웃" muted onClick={() => setPopup("logout")} />
            </div>
          </div>
        </div>
      ) : null}

      {view === "notifications" ? (
        <div className="relative flex flex-col gap-10 mt-6 overflow-y-auto pb-10">
          <div className="flex flex-col gap-1 px-4">
            <p className="m-0 font-pixel text-[22px] tracking-[-0.55px] leading-[1.36] text-[#191f28]">알림 설정</p>
            <p className="m-0 font-pixel text-sm tracking-[0.196px] text-[#4e5968]">필요한 알림만 골라서 받아볼 수 있어요.</p>
          </div>
          <div className="flex flex-col gap-2.5 px-4">
            <p className="m-0 font-pixel text-xs tracking-[0.3px] text-[#6b7684]">알림 설정</p>
            <div className="flex flex-col gap-6">
              {NOTIFICATION_ORDER.map((type) => {
                const setting = notificationSettings.find((item) => item.type === type);
                const enabled = setting?.enabled ?? true;
                return (
                  <div key={type} className="flex items-center gap-6 w-full">
                    <span className="flex-1 min-w-0 font-pixel text-base tracking-[0.16px] text-[#191f28]">{NOTIFICATION_LABELS[type]}</span>
                    <Toggle checked={enabled} onChange={() => toggleNotification(type)} label={NOTIFICATION_LABELS[type]} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {view === "couple" ? (
        <div className="relative flex flex-col gap-10 mt-6 overflow-y-auto pb-10">
          <div className="flex flex-col gap-1 px-4">
            <p className="m-0 font-pixel text-[22px] tracking-[-0.55px] leading-[1.36] text-[#191f28]">커플 연결</p>
            <p className="m-0 font-pixel text-sm tracking-[0.196px] text-[#4e5968]">
              {connected ? "소중한 연인과 연결되어 있어요!" : "아직 연결된 연인이 없어요"}
            </p>
          </div>
          {connected ? (
            <div className="px-4">
              <div className="flex flex-col gap-2 w-full bg-white border-[1.4px] border-[#22d3ee] shadow-[0px_6px_3px_rgba(0,0,0,0.08)] opacity-90 p-3 rounded-[10px]">
                <div className="flex items-center gap-1.5 pb-[9px] border-b border-dashed border-[#d1d6db]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] shrink-0" aria-hidden="true" />
                  <span className="flex-1 min-w-0 font-pixel text-xs tracking-[0.3px] text-[#22d3ee]">연결중</span>
                  <button type="button" className="m-0 p-0 border-none bg-transparent cursor-pointer" onClick={() => setPopup("disconnect")}>
                    <span className="font-pixel text-xs tracking-[0.3px] text-[#8b95a1]">연결 해제</span>
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <span className="relative shrink-0 w-[50px] h-[50px] overflow-hidden" aria-hidden="true">
                    <img className="absolute left-[-12.27%] top-[-12.27%] w-[124.55%] h-[124.55%] max-w-none" src="/minimi/minimi-character.png" alt="" />
                  </span>
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="m-0 font-pixel text-sm tracking-[0.196px] text-[#191f28]">{partnerName}</p>
                    <p className="m-0 font-pixel text-xs tracking-[0.3px] text-[#6b7684]">{dDay !== null ? `D+${dDay}일째 사랑 중` : "함께한 날을 세는 중이에요"}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {popup === "logout" ? (
        <ConfirmDialog lines={["정말 로그아웃 할까요?"]} primaryLabel="로그아웃" onConfirm={confirmLogout} onCancel={() => setPopup(null)} />
      ) : null}
      {popup === "disconnect" ? (
        <ConfirmDialog
          lines={["커플 연결을 해제할까요?", "기록된 데이터는 모두 삭제되며", "30일 안에 복구할 수 있어요."]}
          primaryLabel="연결 해제하기"
          onConfirm={confirmDisconnect}
          onCancel={() => setPopup(null)}
        />
      ) : null}
      {popup === "delete" ? (
        <ConfirmDialog
          lines={["계정을 삭제할까요?", "삭제한 계정은 다시 복구할 수 없어요."]}
          primaryLabel="계정 삭제"
          onConfirm={confirmDelete}
          onCancel={() => setPopup(null)}
        />
      ) : null}

      {notice ? (
        <p className="fixed left-1/2 -translate-x-1/2 bottom-[max(24px,env(safe-area-inset-bottom))] z-40 w-[calc(100%-32px)] max-w-[358px] px-2 py-1 bg-[#fce7f3] border border-[#f9a8d4] font-pixel text-xs text-[#191f28] text-center">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
