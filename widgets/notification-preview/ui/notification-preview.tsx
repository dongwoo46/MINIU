"use client";

import { useEffect, useRef, useState } from "react";
import type { PreviewTab } from "@/shared/config/design-system";
import { getHouse, listNotifications, markNotificationRead, type NotificationData } from "@/shared/api/miniu";
import { HousePopup } from "@/widgets/house-popup";

const CATEGORY: Record<string, { label: string; badgeClass: string; textClass: string; targetTab?: PreviewTab; opensHousePopup?: boolean }> = {
  couple_connected: { label: "시스템", badgeClass: "bg-[#e9f9ff] border-[#7cb6f6]", textClass: "text-[#1d4ed8]" },
  affection_received: { label: "애정 시그널", badgeClass: "bg-[#fce7f3] border-[#f9a8d4]", textClass: "text-[#db2777]", opensHousePopup: true },
  letter_received: { label: "문자", badgeClass: "bg-[#fce7f3] border-[#f9a8d4]", textClass: "text-[#db2777]" },
  profile_merge_candidate: { label: "기록", badgeClass: "bg-[#fce7f3] border-[#f9a8d4]", textClass: "text-[#db2777]", targetTab: "record" },
};
const CATEGORY_FALLBACK = { label: "알림", badgeClass: "bg-[#e9f9ff] border-[#7cb6f6]", textClass: "text-[#1d4ed8]" };

function formatRelativeTime(iso: string): string {
  const diffMinutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export function NotificationPreview({
  onNavigate,
  onBack,
  onOpenSettings,
  devMock,
}: {
  onNavigate?: (tab: PreviewTab) => void;
  onBack?: () => void;
  onOpenSettings?: () => void;
  /** 개발용: 백엔드 호출 없이 알림 목록을 목업 데이터로 바로 보여줄 때만 사용. */
  devMock?: { notifications: NotificationData[]; partnerName?: string; onRead?: (ids: string[]) => void };
}) {
  const [notifications, setNotifications] = useState<NotificationData[]>(devMock?.notifications ?? []);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [loadError, setLoadError] = useState("");
  const [partnerName, setPartnerName] = useState(devMock?.partnerName ?? "연인");
  const [housePopupNotificationId, setHousePopupNotificationId] = useState<string | null>(null);
  const notificationsRef = useRef(notifications);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    if (devMock) return;
    let cancelled = false;
    listNotifications()
      .then((data) => {
        if (!cancelled) setNotifications(data.notifications);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "알림을 불러오지 못했어요.");
      });
    return () => {
      cancelled = true;
    };
  }, [devMock]);

  useEffect(() => {
    if (devMock) return;
    let cancelled = false;
    getHouse()
      .then((house) => {
        if (!cancelled && house.partner.miniu) setPartnerName(house.partner.miniu.name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [devMock]);

  // 알림 화면을 이탈하는 순간(언마운트 시점) 그때까지 보고 있던 안 읽은 알림을 한 번에 읽음 처리한다.
  // 카드를 눌러 이동할 때도 이 정리 함수가 함께 실행돼 자연스럽게 읽음 처리된다.
  useEffect(() => {
    const mockOnRead = devMock?.onRead;
    const isDevMock = Boolean(devMock);
    return () => {
      const unread = notificationsRef.current.filter((item) => !item.isRead);
      if (unread.length === 0) {
        return;
      }
      if (isDevMock) {
        mockOnRead?.(unread.map((item) => item.id));
        return;
      }
      unread.forEach((item) => {
        markNotificationRead(item.id).catch(() => {
          // 나가는 시점의 부수 효과라 실패해도 화면에 보여줄 곳이 없다 — 다음 조회 때 다시 안 읽음으로 보이는 정도로 그친다.
        });
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 언마운트 시 1회만: devMock 여부는 마운트 시점 값을 그대로 클로저로 캡처한다.
  }, []);

  function handleCardClick(notification: NotificationData) {
    const category = CATEGORY[notification.type];
    if (category?.opensHousePopup) {
      setHousePopupNotificationId(notification.id);
      return;
    }
    if (category?.targetTab) {
      onNavigate?.(category.targetTab);
    }
  }

  // 애정 시그널 카드를 눌러 집 팝업을 닫으면, 화면을 나갈 때까지 기다리지 않고
  // 그 자리에서 바로 그 카드를 읽음 처리해 비활성화(흐림)한다.
  function closeHousePopup() {
    const id = housePopupNotificationId;
    setHousePopupNotificationId(null);
    if (!id) return;
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    if (devMock) {
      devMock.onRead?.([id]);
      return;
    }
    markNotificationRead(id).catch(() => {
      // 부수 효과라 실패해도 화면에 보여줄 곳이 없다 — 다음 조회 때 다시 안 읽음으로 보이는 정도로 그친다.
    });
  }

  const sorted = [...notifications].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const sortedNotifications = sortOrder === "latest" ? sorted.reverse() : sorted;

  return (
    <div className="relative flex flex-col h-dvh w-full bg-gradient-to-b from-[#7cb6f6] via-[#e9f9ff] to-white text-[#191f28]">
      <div className="absolute inset-x-0 top-0 h-[404px] overflow-hidden pointer-events-none" aria-hidden="true">
        <img className="absolute left-[-7px] top-[-3px] w-[404px] h-[404px] object-cover mix-blend-soft-light opacity-30 rotate-180" src="/minimi/bg-soft-light.png" alt="" />
      </div>

      <div className="relative flex items-center justify-between h-[59px] px-4">
        <button type="button" onClick={onBack} aria-label="뒤로가기" className="flex items-center justify-center border-0 bg-transparent p-0 cursor-pointer">
          <img src="/terms/chevron-left.svg" alt="" width={28} height={28} style={{ filter: "brightness(0) invert(1)" }} />
        </button>
        <div className="flex items-center gap-2">
          <button type="button" className="relative w-9 h-9 border-0 bg-transparent p-0 cursor-pointer" aria-label="설정" onClick={onOpenSettings}>
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
          </button>
        </div>
      </div>

      <div className="relative flex items-center justify-between h-[21px] mt-6 mx-4 font-pixel text-sm text-[#191f28]">
        <p className="m-0">
          총 <span className="text-[#db2777]">{notifications.length}</span>개 알림
        </p>
        <button
          type="button"
          className="flex items-center gap-1 m-0 p-0 border-none bg-transparent font-pixel text-sm text-[#191f28] cursor-pointer"
          onClick={() => setSortOrder((prev) => (prev === "latest" ? "oldest" : "latest"))}
        >
          <span>{sortOrder === "latest" ? "최신순" : "오래된순"}</span>
          <img src="/minimi/sort-icon.svg" alt="" width={16} height={16} className="rotate-90" aria-hidden="true" />
        </button>
      </div>

      {loadError ? <p className="relative mx-4 mt-2 font-pixel text-xs text-[#db2777]">{loadError}</p> : null}

      <div className="relative flex-1 min-h-0 flex flex-col gap-2 px-4 pt-3 pb-4 overflow-y-auto">
        {sortedNotifications.length === 0 && !loadError ? (
          <p className="font-pixel text-xs text-[#8b95a1] text-center py-8">아직 알림이 없어요</p>
        ) : null}
        {sortedNotifications.map((notification) => {
          const category = CATEGORY[notification.type] ?? CATEGORY_FALLBACK;
          const isInteractive = Boolean(category.targetTab || category.opensHousePopup);
          const isAffection = notification.type === "affection_received";
          const Wrapper = isInteractive ? "button" : "div";
          return (
            <Wrapper
              key={notification.id}
              type={isInteractive ? "button" : undefined}
              onClick={isInteractive ? () => handleCardClick(notification) : undefined}
              className={`flex flex-col gap-1.5 px-3 py-3.5 bg-white border-2 border-[#2b1f28] drop-shadow-[2px_2px_0px_rgba(17,17,17,0.2)] text-left ${isInteractive ? "cursor-pointer" : "cursor-default"} ${notification.isRead ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-1.5 pb-[9px] border-b border-dashed border-[#d1d6db]">
                <span className={`shrink-0 px-[5px] py-px border font-pixel text-[10px] whitespace-nowrap ${category.badgeClass} ${category.textClass}`}>{category.label}</span>
                <span className="flex-1 min-w-0 text-right font-pixel text-xs tracking-[0.3px] text-[#8b95a1]">{formatRelativeTime(notification.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <p className="flex-1 min-w-0 m-0 font-pixel text-xs tracking-[0.3px] text-[#191f28]">{notification.title}</p>
                {isInteractive ? <span className="shrink-0 inline-block text-[10px] text-[#2b1f28] -rotate-90">▼</span> : null}
              </div>
              {notification.body ? (
                <div className="bg-[#fafbfc] border border-[#e5e8eb] px-[9px] py-[9px]">
                  <p className="m-0 font-pixel text-xs tracking-[0.3px] leading-[1.3] text-[#4b5563]">{notification.body}</p>
                </div>
              ) : null}
              {isAffection ? <p className="m-0 font-pixel text-[10px] text-[#db2777] whitespace-nowrap">(+애정도 5 UP!)</p> : null}
            </Wrapper>
          );
        })}
      </div>

      {housePopupNotificationId && <HousePopup partnerName={partnerName} onClose={closeHousePopup} devMock={Boolean(devMock)} />}
    </div>
  );
}
