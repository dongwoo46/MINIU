"use client";

import { useEffect, useState, type FormEvent } from "react";
import { MinimiAvatar } from "@/entities/minimi";
import {
  acceptItemSuggestion,
  createMiniu,
  getChatQuota,
  getHouse,
  listInventory,
  listItemSuggestions,
  listNotifications,
  markNotificationRead,
  rejectItemSuggestion,
  sendAffection,
  sendChatMessage,
  type ChatQuota,
  type HouseData,
  type InventoryItem,
  type ItemSuggestion,
  type NotificationData,
  updateInventoryItem,
} from "@/shared/api/miniu";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Chip } from "@/shared/ui/chip";
import { Icon } from "@/shared/ui/icon";
import { TextField } from "@/shared/ui/text-field";

const TITLE_BAR =
  "flex items-center justify-between px-2 py-1 border-b-2 border-[#4e5968] bg-gradient-to-r from-[#5376c7] via-[#5c82db] to-[#456cb8] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-xs [&_p]:text-white [&_p]:tracking-[0.3px]";
const WINDOW_BTN =
  "flex items-center justify-center w-4 h-4 p-0 border-2 border-white bg-[#d8dee9] cursor-pointer";
const AFFECTION_BUTTON =
  "w-[106.33px] shrink-0 flex flex-col items-center justify-center gap-0.5 h-[76px] px-0.5 py-2 border-2 border-white bg-gradient-to-b from-white via-[#accef3] to-[#7cb6f6] shadow-[2px_2px_0px_rgba(17,17,17,0.2)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const MINIU_PRESETS = ["basic", "cool", "cute"];
const HAIR_STYLES = ["short", "long", "curly", "ponytail"];
const HAIR_COLORS = ["brown", "black", "blonde", "pink"];
const SKIN_TONES = ["warm", "fair", "tan", "deep"];
const FACE_SHAPES = ["round", "oval", "heart", "square"];
const EXPRESSIONS = ["smile", "wink", "calm", "giggle"];

function AttributePicker({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="attribute-picker">
      <span className="attribute-picker-label">{label}</span>
      <div className="chip-list">
        {options.map((option) => (
          <Chip key={option} selected={value === option} onClick={() => onChange(option)}>{option}</Chip>
        ))}
      </div>
    </div>
  );
}

export function HomePreview() {
  const [house, setHouse] = useState<HouseData | null>(null);
  const [quota, setQuota] = useState<ChatQuota | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [inventory, setInventory] = useState<{ items: InventoryItem[]; limit: number } | null>(null);
  const [suggestions, setSuggestions] = useState<ItemSuggestion[]>([]);
  const [message, setMessage] = useState("");
  const [miniuName, setMiniuName] = useState("");
  const [miniuPreset, setMiniuPreset] = useState(MINIU_PRESETS[0]);
  const [miniuHairStyle, setMiniuHairStyle] = useState(HAIR_STYLES[0]);
  const [miniuHairColor, setMiniuHairColor] = useState(HAIR_COLORS[0]);
  const [miniuSkinTone, setMiniuSkinTone] = useState(SKIN_TONES[0]);
  const [miniuFaceShape, setMiniuFaceShape] = useState(FACE_SHAPES[0]);
  const [miniuExpression, setMiniuExpression] = useState(EXPRESSIONS[0]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [showHousePopup, setShowHousePopup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getHouse(), getChatQuota(), listNotifications(), listInventory(), listItemSuggestions()])
      .then(([houseData, quotaData, notificationData, inventoryData, suggestionData]) => {
        if (!cancelled) {
          setHouse(houseData);
          setQuota(quotaData);
          setNotifications(notificationData.notifications);
          setInventory(inventoryData);
          setSuggestions(suggestionData.suggestions);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "홈 정보를 불러오지 못했어요.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submitChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      return;
    }
    setPending(true);
    setStatus("");
    try {
      const data = await sendChatMessage(trimmed);
      setReply(data.reply);
      setQuota(data.usage);
      setMessage("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "대화를 보내지 못했어요.");
    } finally {
      setPending(false);
    }
  }

  async function handleAffection(affectionType: "hug" | "kiss" | "pat") {
    setPending(true);
    setStatus("");
    try {
      await sendAffection(affectionType);
      setStatus("마음을 보냈어요.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "마음을 보내지 못했어요.");
    } finally {
      setPending(false);
    }
  }

  async function readNotification(notification: NotificationData) {
    if (notification.isRead) {
      return;
    }
    try {
      const data = await markNotificationRead(notification.id);
      setNotifications((current) => current.map((item) => (item.id === notification.id ? data.notification : item)));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "알림을 읽음 처리하지 못했어요.");
    }
  }

  async function submitMiniu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = miniuName.trim();
    if (!name) {
      return;
    }
    setPending(true);
    setStatus("");
    try {
      const data = await createMiniu({
        name,
        preset: miniuPreset,
        hairStyle: miniuHairStyle,
        hairColor: miniuHairColor,
        skinTone: miniuSkinTone,
        faceShape: miniuFaceShape,
        expression: miniuExpression,
      });
      setHouse((current) => current ? { ...current, me: { ...current.me, miniu: data.miniu }, locks: { ...current.locks, needsMiniu: false, canCustomizeMiniu: true } } : current);
      setMiniuName("");
      setStatus("내 미니유를 만들었어요.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "미니유를 만들지 못했어요.");
    } finally {
      setPending(false);
    }
  }

  async function decideSuggestion(suggestion: ItemSuggestion, decision: "accept" | "reject") {
    setPending(true);
    setStatus("");
    try {
      if (decision === "accept") {
        const data = await acceptItemSuggestion(suggestion.id);
        setInventory((current) => ({
          items: [data.item, ...(current?.items ?? [])],
          limit: current?.limit ?? 10,
        }));
        setSuggestions((current) => current.map((item) => (item.id === suggestion.id ? data.suggestion : item)));
        setStatus("아이템을 보관함에 넣었어요.");
      } else {
        const data = await rejectItemSuggestion(suggestion.id);
        setSuggestions((current) => current.map((item) => (item.id === suggestion.id ? data.suggestion : item)));
        setStatus("아이템 제안을 거절했어요.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "아이템 제안을 처리하지 못했어요.");
    } finally {
      setPending(false);
    }
  }

  async function toggleItem(item: InventoryItem) {
    setPending(true);
    setStatus("");
    try {
      const data = await updateInventoryItem(item.id, !item.equipped);
      setInventory((current) => current ? { ...current, items: current.items.map((entry) => (entry.id === item.id ? data.item : entry)) } : current);
      setStatus(data.item.equipped ? "아이템을 장착했어요." : "아이템을 해제했어요.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "아이템을 바꾸지 못했어요.");
    } finally {
      setPending(false);
    }
  }

  const partnerName = house?.partner.miniu?.name ?? "연인";

  return (
    <section className="preview home-preview" aria-labelledby="home-title">
      <div className="page-heading">
        <span className="eyebrow">OUR LITTLE WORLD</span>
        <h1 id="home-title">오늘도 놀러왔네!</h1>
        <p>{house ? `${partnerName}의 작은 세상에 연결됐어요.` : "작은 순간들이 모여, 더 가까운 우리."}</p>
      </div>

      <div className="room">
        <div className="room-name">
          <Icon name="home" width="16" height="16" /> {partnerName}의 집 <Badge tone={house ? "green" : "pink"}>{house ? "함께하는 중" : "연결 확인 중"}</Badge>
        </div>
        <div className="room-window" aria-hidden="true"><span>✦</span></div>
        <span className="room-picture" aria-hidden="true">♥</span>
        <div className="room-plant" aria-hidden="true">♣</div>
        <div className="room-rug" aria-hidden="true" />
        <div className="room-character">
          <div className="speech-bubble">{reply || `${partnerName}에게 말을 걸어보세요`} <span>♥</span></div>
          <MinimiAvatar />
        </div>
        <span className="room-caption">{house?.locks.needsMiniu ? "내 미니유를 만들면 꾸미기가 열려요" : `${partnerName}의 작은 세상`}</span>
      </div>

      {status && <p className="preview-footnote">{status}</p>}
      {!house && !status && <EmptyState title="집 정보를 불러오는 중이에요" description="잠시만 기다려주세요." />}

      {house?.locks.needsMiniu && (
        <form className="miniu-create-form" onSubmit={submitMiniu}>
          <TextField label="내 미니유 이름" placeholder="이름을 입력해 주세요" maxLength={20} value={miniuName} onChange={(event) => setMiniuName(event.target.value)} />
          <AttributePicker label="프리셋" options={MINIU_PRESETS} value={miniuPreset} onChange={setMiniuPreset} />
          <AttributePicker label="헤어스타일" options={HAIR_STYLES} value={miniuHairStyle} onChange={setMiniuHairStyle} />
          <AttributePicker label="머리색" options={HAIR_COLORS} value={miniuHairColor} onChange={setMiniuHairColor} />
          <AttributePicker label="피부톤" options={SKIN_TONES} value={miniuSkinTone} onChange={setMiniuSkinTone} />
          <AttributePicker label="얼굴형" options={FACE_SHAPES} value={miniuFaceShape} onChange={setMiniuFaceShape} />
          <AttributePicker label="표정" options={EXPRESSIONS} value={miniuExpression} onChange={setMiniuExpression} />
          <Button type="submit" fullWidth disabled={pending || !miniuName.trim()}>미니유 만들기</Button>
        </form>
      )}

      <div className="home-note">
        <Icon name="heart" width="18" height="18" />
        <span>{quota ? `오늘 대화 ${quota.remaining}/${quota.limit}회 남았어요` : "오늘은 어떤 이야기를 해줄까?"}</span>
      </div>

      <form className="chat-preview" onSubmit={submitChat}>
        <TextField label={`${partnerName}에게 한마디`} placeholder="대화를 입력해 주세요" maxLength={150} value={message} onChange={(event) => setMessage(event.target.value)} />
        <Button type="submit" aria-label="대화 보내기" disabled={pending || !message.trim()}><Icon name="arrow" /></Button>
      </form>

      {house?.locks.canVisit && (
        <Button variant="secondary" fullWidth disabled={pending} onClick={() => setShowHousePopup(true)}>{partnerName} 집에 놀러가기</Button>
      )}

      <div className="section-heading">
        <h2>알림</h2>
        <span>{notifications.filter((item) => !item.isRead).length}개 안 읽음</span>
      </div>
      <div className="letter-list">
        {(showAllNotifications ? notifications : notifications.slice(0, 3)).map((notification) => (
          <button key={notification.id} type="button" className="letter-item surface" onClick={() => readNotification(notification)}>
            <span className="letter-stamp"><Icon name="heart" /></span>
            <span className="letter-content">
              <span className="letter-sender">{notification.title} {!notification.isRead && <span className="new-dot" aria-label="새 알림" />}</span>
              {notification.body && <span className="letter-excerpt">{notification.body}</span>}
            </span>
          </button>
        ))}
        {notifications.length === 0 && <EmptyState title="새 알림이 없어요" />}
        {notifications.length > 3 && (
          <button type="button" className="auth-link" onClick={() => setShowAllNotifications((value) => !value)}>
            {showAllNotifications ? "접기" : `전체 보기 (${notifications.length})`}
          </button>
        )}
      </div>

      <div className="section-heading">
        <h2>인벤토리</h2>
        <span>{inventory ? `${inventory.items.length}/${inventory.limit}` : "확인 중"}</span>
      </div>
      <div className="chip-list">
        {(inventory?.items.length ? inventory.items : house?.me.equippedItems ?? []).slice(0, 5).map((item) => (
          <button key={item.id} type="button" className="auth-link" disabled={pending} onClick={() => toggleItem(item)}>
            {item.name}{item.equipped ? " 해제" : " 장착"}
          </button>
        ))}
      </div>
      {suggestions.filter((item) => item.status === "pending").slice(0, 3).map((item) => (
        <div key={item.id} className="home-note">
          <Icon name="sparkle" width="18" height="18" />
          <span>{item.itemName}</span>
          <Button variant="secondary" disabled={pending} onClick={() => decideSuggestion(item, "accept")}>받기</Button>
          <Button variant="ghost" disabled={pending} onClick={() => decideSuggestion(item, "reject")}>거절</Button>
        </div>
      ))}

      <p className="preview-footnote">실제 집, AI 채팅, 애정표현 API와 연결됐어요</p>

      {showHousePopup && (
        <>
          <div
            className="fixed inset-0 bg-[#111] opacity-80 z-10 cursor-pointer"
            onClick={() => setShowHousePopup(false)}
            aria-hidden="true"
          />
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[358px] max-w-[calc(100%-32px)] flex flex-col items-stretch border-2 border-white shadow-[2px_2px_0px_0px_rgba(17,17,17,0.2)] z-[11]"
            role="dialog"
            aria-modal="true"
            aria-label={`${partnerName} 집`}
          >
            <div className={TITLE_BAR}>
              <p>my home.exe - [wellcome!]</p>
              <div className="flex items-center gap-0.5">
                <span className={WINDOW_BTN} aria-hidden="true">
                  <span className="w-2 h-2 border-[1.5px] border-[#111] box-border" />
                </span>
                <button type="button" className={WINDOW_BTN} onClick={() => setShowHousePopup(false)} aria-label="팝업 닫기">
                  <Icon name="close" width={10} height={10} />
                </button>
              </div>
            </div>

            <div className="w-full p-2 bg-[#d8dee9]">
              <div className="flex items-center gap-1 w-full p-[10px] bg-white border-2 border-[#2b1f28]">
                <Icon name="heart" width={14} height={14} className="shrink-0 text-[#db2777]" />
                <p className="flex-1 min-w-0 m-0 font-pixel text-xs tracking-[0.3px] text-[#db2777]">
                  {status || `${partnerName}와 마음을 나눠보세요`}
                </p>
              </div>
            </div>

            <div className="w-full px-2 py-1 bg-[#d8dee9]">
              <div className="relative w-full h-[236px] overflow-hidden border-2 border-[#191f28]">
                <img className="w-full h-full object-cover object-top" src="/minimi/room-bg.png" alt={`${partnerName}의 방`} />
                <div className="absolute left-1/2 bottom-[17.2px] -translate-x-1/2 w-[98px] h-[137px]">
                  <img
                    className="absolute left-1/2 top-[121px] w-[104px] h-[15px] -translate-x-1/2"
                    src="/minimi/popup-minimi-shadow.svg"
                    alt=""
                    aria-hidden="true"
                  />
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img
                      className="absolute left-[-42.41%] top-[-12.36%] w-[185.86%] h-[133%] max-w-none"
                      src="/minimi/minimi-character.png"
                      alt="미니유 캐릭터"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-5 w-full pt-2 px-2 pb-1.5 bg-[#d8dee9]">
                <div className="flex justify-center gap-[10px] w-full">
                  <button type="button" className={AFFECTION_BUTTON} disabled={pending} onClick={() => handleAffection("pat")}>
                    <span className="relative overflow-hidden shrink-0 w-[26px] h-[24px]">
                      <img className="absolute left-[-87.05%] top-[-49.84%] w-[274.41%] h-[199.36%] max-w-none" src="/minimi/heart-icon.png" alt="" aria-hidden="true" />
                    </span>
                    <span className="flex items-center gap-0.5 font-pixel text-sm tracking-[0.196px] text-[#2b1f28]">
                      <span>쓰다듬기</span>
                      <span className="text-[10px]">▼</span>
                    </span>
                  </button>
                  <button type="button" className={AFFECTION_BUTTON} disabled={pending} onClick={() => handleAffection("hug")}>
                    <span className="relative overflow-hidden shrink-0 w-6 h-[22px]">
                      <img className="absolute left-[-87.05%] top-[-49.84%] w-[274.41%] h-[199.36%] max-w-none" src="/minimi/heart-icon.png" alt="" aria-hidden="true" />
                    </span>
                    <span className="flex items-center gap-0.5 font-pixel text-sm tracking-[0.196px] text-[#2b1f28]">
                      <span>안아주기</span>
                      <span className="text-[10px]">▼</span>
                    </span>
                  </button>
                  <button type="button" className={AFFECTION_BUTTON} disabled={pending} onClick={() => handleAffection("kiss")}>
                    <span className="relative overflow-hidden shrink-0 w-6 h-[22px]">
                      <img className="absolute left-[-87.05%] top-[-49.84%] w-[274.41%] h-[199.36%] max-w-none" src="/minimi/heart-icon.png" alt="" aria-hidden="true" />
                    </span>
                    <span className="flex items-center gap-0.5 font-pixel text-sm tracking-[0.196px] text-[#2b1f28]">
                      <span>뽀뽀하기</span>
                      <span className="text-[10px]">▼</span>
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  className="w-full h-[41px] border-2 border-white bg-[#d8dee9] shadow-[1px_1px_0px_rgba(0,0,0,0.2)] font-pixel text-sm tracking-[0.196px] text-[#333d4b] cursor-pointer"
                  onClick={() => setShowHousePopup(false)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
