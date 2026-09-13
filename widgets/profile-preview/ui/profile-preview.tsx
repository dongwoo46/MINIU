"use client";

import { useEffect, useState } from "react";
import type { PreviewTab } from "@/shared/config/design-system";
import { getHouse, getPreQuestions, listNotifications } from "@/shared/api/miniu";

const TITLE_BAR =
  "flex items-center justify-between px-2 py-1 border-b-2 border-[#4e5968] bg-gradient-to-r from-[#5376c7] via-[#5c82db] to-[#456cb8] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-xs [&_p]:text-white [&_p]:tracking-[0.3px]";
const WINDOW_BTN =
  "flex items-center justify-center w-4 h-4 p-0 border-2 border-white bg-[#d8dee9] cursor-pointer";
const NAV_ITEM =
  "flex-1 flex flex-col items-center gap-1 px-[10px] py-1.5 border-none bg-transparent no-underline cursor-pointer [&_img]:w-[46px] [&_img]:h-[46px] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-base [&_p]:text-[#191f28]";

const PARTNER_SUMMARY_MAX_LENGTH = 40;

const PARTNER_FILE_CATEGORIES = [
  { id: "likes", label: "좋아하는 것" },
  { id: "dislikes", label: "싫어하는 것" },
  { id: "tendencies", label: "평소 성향" },
  { id: "habits", label: "자주하는 습관" },
  { id: "values", label: "가치관" },
] as const;

type PartnerFileCategory = (typeof PARTNER_FILE_CATEGORIES)[number]["id"];

function calcDDay(startedOn: string | null): number | null {
  if (!startedOn) return null;
  const start = new Date(`${startedOn}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
}

export function ProfilePreview({
  onNavigate,
  devMock,
}: {
  onNavigate?: (tab: PreviewTab) => void;
  /** 개발용: 백엔드 호출 없이 연인 정보를 목업 데이터로 바로 보여줄 때만 사용. */
  devMock?: { partnerName: string; dDay: number | null; summary: string; unreadCount: number };
}) {
  const [unreadCount, setUnreadCount] = useState(devMock?.unreadCount ?? 0);
  const [partnerName, setPartnerName] = useState(devMock?.partnerName ?? "연인");
  const [relationshipStartedOn, setRelationshipStartedOn] = useState<string | null>(null);
  const [summary, setSummary] = useState(devMock?.summary ?? "");
  const [selectedCategory, setSelectedCategory] = useState<PartnerFileCategory | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (devMock) return;
    let cancelled = false;
    Promise.all([getHouse(), getPreQuestions(), listNotifications()])
      .then(([house, { preQuestions }, notifications]) => {
        if (cancelled) return;
        if (house.partner.miniu) setPartnerName(house.partner.miniu.name);
        setUnreadCount(notifications.unreadCount);
        if (preQuestions) {
          setRelationshipStartedOn(preQuestions.relationshipStartedOn);
          setSummary(preQuestions.tendencies.join(" ").slice(0, PARTNER_SUMMARY_MAX_LENGTH));
        }
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "연인 정보를 불러오지 못했어요.");
      });
    return () => {
      cancelled = true;
    };
  }, [devMock]);

  const dDay = devMock ? devMock.dDay : calcDDay(relationshipStartedOn);
  const displaySummary = summary.slice(0, PARTNER_SUMMARY_MAX_LENGTH);

  return (
    <div className="relative flex flex-col min-h-dvh w-full bg-gradient-to-b from-[#7cb6f6] via-[#e9f9ff] to-white text-[#191f28]">
      <div className="absolute inset-x-0 top-0 h-[404px] overflow-hidden pointer-events-none" aria-hidden="true">
        <img className="absolute left-[-7px] top-[-3px] w-[404px] h-[404px] object-cover mix-blend-soft-light opacity-30 rotate-180" src="/minimi/bg-soft-light.png" alt="" />
      </div>

      <div className="relative flex items-center justify-between h-[59px] px-4">
        <p className="m-0 font-pixel text-[36px] text-white tracking-[-0.72px] leading-none whitespace-nowrap">MINIU</p>
        <div className="flex items-center gap-2">
          <div className="relative w-9 h-9" aria-hidden="true">
            <span className="absolute bg-white left-[14.5px] right-[14.5px] top-[6.33px] bottom-[27.33px]" />
            <span className="absolute bg-white left-[12.17px] right-[21.5px] top-[8.67px] bottom-[25px]" />
            <span className="absolute bg-white left-[21.5px] right-[12.17px] top-[8.67px] bottom-[25px]" />
            <span className="absolute bg-white left-[9.83px] right-[23.83px] top-[11px] bottom-[16.83px]" />
            <span className="absolute bg-white left-[23.83px] right-[9.83px] top-[11px] bottom-[16.83px]" />
            <span className="absolute bg-white left-[7.5px] right-[26.17px] top-[19.17px] bottom-[12.17px]" />
            <span className="absolute bg-white left-[26.17px] right-[7.5px] top-[19.17px] bottom-[12.17px]" />
            <span className="absolute bg-white left-[7.5px] right-[7.5px] top-[21.5px] bottom-[12.17px]" />
            <span className="absolute bg-white left-[13.33px] right-[20.33px] top-[25px] bottom-[8.67px]" />
            <span className="absolute bg-white left-[20.33px] right-[13.33px] top-[25px] bottom-[8.67px]" />
            <span className="absolute bg-white left-[13.33px] right-[13.33px] top-[27.33px] bottom-[6.33px]" />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 font-pixel text-[9px] text-white bg-[#db2777] border border-white px-1">{unreadCount}</span>}
          </div>
          <div className="relative w-9 h-9" aria-hidden="true">
            <div className="absolute left-[1.93px] top-[1.93px] w-[32.143px] h-[32.143px] overflow-hidden">
              <img className="absolute left-[-83.33%] top-[-71.46%] w-[268%] h-[244.92%] max-w-none" src="/minimi/gear-icon.png" alt="" />
            </div>
            <span className="absolute bg-white left-[13.19px] top-[16.36px] w-[1.957px] h-[3.842px]" />
            <span className="absolute bg-white left-[21.25px] top-[16.36px] w-[1.957px] h-[3.842px]" />
            <span className="absolute bg-white left-[16.44px] top-[13.25px] w-[3.601px] h-[1.957px]" />
            <span className="absolute bg-white left-[19.98px] top-[14.83px] w-[1.531px] h-[1.529px]" />
            <span className="absolute bg-white left-[19.98px] top-[20.1px] w-[1.531px] h-[1.529px]" />
            <span className="absolute bg-white left-[14.91px] top-[20.1px] w-[1.531px] h-[1.529px]" />
            <span className="absolute bg-white left-[14.91px] top-[14.83px] w-[1.531px] h-[1.529px]" />
            <span className="absolute bg-white left-[16.44px] top-[21.39px] w-[3.601px] h-[1.957px]" />
          </div>
        </div>
      </div>

      {loadError ? <p className="relative mx-4 mt-2 font-pixel text-xs text-[#db2777]">{loadError}</p> : null}

      <div className="relative flex-1 flex flex-col gap-6 px-4 pb-[130px] mt-2">
        <section className="flex flex-col gap-2.5">
          <p className="m-0 font-pixel text-base text-[#191f28] tracking-[0.16px]">연인 정보</p>
          <div className="flex items-start justify-between gap-2 bg-white border-2 border-[#2b1f28] shadow-[2px_2px_0px_rgba(0,0,0,0.2)] px-[18px] py-4">
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1">
                <span className="relative shrink-0 w-[18px] h-[18px]" aria-hidden="true">
                  <span className="absolute left-[2.81px] top-[1.13px] w-[12.375px] h-[15.75px] overflow-hidden">
                    <img className="absolute left-[-30.46%] top-[-48.85%] w-[254.96%] h-[200.33%] max-w-none" src="/minimi/profile-heart-icon.png" alt="" />
                  </span>
                </span>
                <span className="font-pixel text-sm text-[#191f28] tracking-[0.196px]">{partnerName}</span>
              </div>
              <p className="m-0 font-pixel text-sm text-[#6b7684] tracking-[0.196px]">{displaySummary || "아직 요약이 없어요"}</p>
            </div>
            {dDay !== null && (
              <span className="shrink-0 px-[9px] py-[3px] bg-[#fce7f3] border border-[#f9a8d4] font-pixel text-sm text-[#db2777] tracking-[0.196px] whitespace-nowrap">
                D+{dDay}
              </span>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <p className="m-0 font-pixel text-base text-[#191f28] tracking-[0.16px]">연인 파일</p>
            <p className="m-0 font-pixel text-sm text-[#6b7684] tracking-[0.196px]">{partnerName}와 관련된 정보가 저장되어 있어요</p>
          </div>
          <div className="flex flex-col items-stretch bg-white border-2 border-[#2b1f28] shadow-[2px_2px_0px_rgba(0,0,0,0.2)] overflow-hidden w-full">
            <div className={TITLE_BAR}>
              <p>{`${partnerName} file.exe - [zip]`}</p>
              <div className="flex items-center gap-0.5">
                <span className={WINDOW_BTN} aria-hidden="true">
                  <img src="/home/win-btn-1.svg" alt="" width={10} height={10} />
                </span>
                <img src="/home/win-btn-2.svg" alt="" width={16} height={16} className="shrink-0" aria-hidden="true" />
                <span className={WINDOW_BTN} aria-hidden="true">
                  <img src="/home/win-btn-3.svg" alt="" width={10} height={10} />
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 pt-1 pb-[5px] bg-[#d8dee9] border-b border-[#4e5968] font-pixel text-[10px] text-[#191f28] w-full [&_p]:m-0">
              <p>파일(F)</p>
              <p>동작(A)</p>
              <p>보기(V)</p>
              <p>도움말(H)</p>
            </div>
            <div className="grid grid-cols-3 gap-x-[26px] gap-y-8 justify-items-center py-6 px-4 w-full">
              {PARTNER_FILE_CATEGORIES.map((item) => {
                const isSelected = selectedCategory === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="flex flex-col items-center gap-1.5 m-0 p-0 border-none bg-transparent cursor-pointer"
                    onClick={() => setSelectedCategory(item.id)}
                  >
                    <span className="relative block w-[54px] h-12" aria-hidden="true">
                      <img src="/minimi/folder-back.svg" alt="" className="absolute inset-0 w-full h-full" />
                      <span className="absolute inset-x-0 bottom-0 mx-px h-[38px] flex items-center justify-center rounded-[4px] border-[1.286px] border-[#7cb6f6] bg-gradient-to-b from-[#bfdbfe] to-[#60a5fa]">
                        <span className="font-pixel text-xs text-[#333d4b] tracking-[0.3px]">ZIP</span>
                      </span>
                    </span>
                    <span
                      className={`px-1 rounded-[4px] font-pixel text-xs tracking-[0.3px] whitespace-nowrap transition-colors duration-150 ${
                        isSelected ? "bg-[rgba(37,99,235,0.6)] text-white" : "bg-transparent text-[#191f28]"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-[5] mx-auto flex w-full max-w-[var(--shell-width)] items-center gap-[10px] bg-gradient-to-t from-white via-white/95 to-transparent px-7 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        <button type="button" className={`${NAV_ITEM} opacity-60`} onClick={() => onNavigate?.("home")}>
          <img src="/minimi/nav-home.png" alt="" aria-hidden="true" />
          <p>홈</p>
        </button>
        <button type="button" className={`${NAV_ITEM} opacity-60`} onClick={() => onNavigate?.("record")}>
          <img src="/minimi/nav-record.png" alt="" aria-hidden="true" />
          <p>기록</p>
        </button>
        <button type="button" className={NAV_ITEM} onClick={() => onNavigate?.("profile")}>
          <img src="/minimi/nav-profile.png" alt="" aria-hidden="true" />
          <p>프로필</p>
        </button>
      </nav>
    </div>
  );
}
