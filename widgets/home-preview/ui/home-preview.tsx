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

      <div className="chip-list" role="group" aria-label="애정표현 보내기">
        <Button variant="secondary" disabled={pending} onClick={() => handleAffection("hug")}>안아주기</Button>
        <Button variant="secondary" disabled={pending} onClick={() => handleAffection("kiss")}>뽀뽀하기</Button>
        <Button variant="secondary" disabled={pending} onClick={() => handleAffection("pat")}>쓰다듬기</Button>
      </div>

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
    </section>
  );
}
