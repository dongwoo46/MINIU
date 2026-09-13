"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { PreviewTab } from "@/shared/config/design-system";
import {
  createMiniu,
  getChatQuota,
  getHouse,
  getPreQuestions,
  listNotifications,
  sendAffection,
  sendChatMessage,
  type ChatQuota,
  type HouseData,
} from "@/shared/api/miniu";
import { Icon } from "@/shared/ui/icon";
import { ButtonPrimary } from "@/shared/ui/pixel-button";

const MINIU_PRESETS = ["basic", "cool", "cute"];
const HAIR_STYLES = ["short", "long", "curly", "ponytail"];
const HAIR_COLORS = ["brown", "black", "blonde", "pink"];
const SKIN_TONES = ["warm", "fair", "tan", "deep"];
const FACE_SHAPES = ["round", "oval", "heart", "square"];
const EXPRESSIONS = ["smile", "wink", "calm", "giggle"];

const TITLE_BAR =
  "flex items-center justify-between px-2 py-1 border-b-2 border-[#4e5968] bg-gradient-to-r from-[#5376c7] via-[#5c82db] to-[#456cb8] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-xs [&_p]:text-white [&_p]:tracking-[0.3px]";
const WINDOW_BTN =
  "flex items-center justify-center w-4 h-4 p-0 border-2 border-white bg-[#d8dee9] cursor-pointer";
const NAV_ITEM =
  "flex-1 flex flex-col items-center gap-1 px-[10px] py-1.5 border-none bg-transparent no-underline cursor-pointer [&_img]:w-[46px] [&_img]:h-[46px] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-base [&_p]:text-[#191f28]";
const AFFECTION_BUTTON =
  "flex-1 flex flex-col items-center justify-center gap-0.5 h-[76px] px-0.5 py-2 border-2 border-white bg-gradient-to-b from-white via-[#accef3] to-[#7cb6f6] shadow-[2px_2px_0px_rgba(17,17,17,0.2)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const ATTR_PICK =
  "px-2 py-1 border-2 border-[#2b1f28] font-pixel text-[10px] tracking-[0.3px] cursor-pointer";

function calcDDay(startedOn: string | null): number | null {
  if (!startedOn) return null;
  const start = new Date(`${startedOn}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
}

function AttributePicker({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-pixel text-[10px] text-[#4e5968]">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? `${ATTR_PICK} bg-[#191f28] text-white` : `${ATTR_PICK} bg-white text-[#191f28]`}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function HomePreview({ onNavigate }: { onNavigate?: (tab: PreviewTab) => void }) {
  const [house, setHouse] = useState<HouseData | null>(null);
  const [quota, setQuota] = useState<ChatQuota | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [message, setMessage] = useState("");
  const [isMessageFocused, setIsMessageFocused] = useState(false);
  const [miniuName, setMiniuName] = useState("");
  const [miniuPreset, setMiniuPreset] = useState(MINIU_PRESETS[0]);
  const [miniuHairStyle, setMiniuHairStyle] = useState(HAIR_STYLES[0]);
  const [miniuHairColor, setMiniuHairColor] = useState(HAIR_COLORS[0]);
  const [miniuSkinTone, setMiniuSkinTone] = useState(SKIN_TONES[0]);
  const [miniuFaceShape, setMiniuFaceShape] = useState(FACE_SHAPES[0]);
  const [miniuExpression, setMiniuExpression] = useState(EXPRESSIONS[0]);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);
  const [showHousePopup, setShowHousePopup] = useState(false);
  const [relationshipStartedOn, setRelationshipStartedOn] = useState<string | null>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getHouse(), getChatQuota(), listNotifications(), getPreQuestions().catch(() => ({ preQuestions: null }))])
      .then(([houseData, quotaData, notificationData, preQuestionsData]) => {
        if (!cancelled) {
          setHouse(houseData);
          setQuota(quotaData);
          setUnreadCount(notificationData.unreadCount);
          setRelationshipStartedOn(preQuestionsData.preQuestions?.relationshipStartedOn ?? null);
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

  useEffect(() => {
    const el = messageRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 20), 64)}px`;
  }, [message]);

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

  async function submitMiniu() {
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

  const partnerName = house?.partner.miniu?.name ?? "연인";
  const dDay = calcDDay(relationshipStartedOn);

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

      <div className="relative flex-1 flex flex-col items-stretch gap-4 px-4 pb-[110px] mt-[26px]">
        <div className="flex flex-col w-full border-2 border-[#2b1f28] shadow-[2px_2px_0px_0px_rgba(17,17,17,0.2)]">
          <div className={TITLE_BAR}>
            <p>jisoo_cam.exe - [Live Garden Stage]</p>
            <div className="flex items-center gap-0.5">
              <span className={WINDOW_BTN} aria-hidden="true">
                <img className="w-[10px] h-[10px]" src="/minimi/window-btn-min.svg" alt="" />
              </span>
              <span className={WINDOW_BTN} aria-hidden="true">
                <span className="w-2 h-2 border-[1.5px] border-[#111] box-border" />
              </span>
              <span className={WINDOW_BTN} aria-hidden="true">
                <img className="w-[6.124px] h-[6.124px]" src="/minimi/window-btn-close.svg" alt="" />
              </span>
            </div>
          </div>

          <div className="flex gap-3 px-2 py-1 bg-[#d8dee9] border-b border-[#4e5968] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-[10px]">
            <p>파일(F)</p>
            <p>동작(A)</p>
            <p>보기(V)</p>
            <p>도움말(H)</p>
          </div>

          <div className="py-1 px-2 bg-[#d8dee9]">
            <div className="relative w-full h-[236px] overflow-hidden border-2 border-[#191f28]">
              <img className="w-full h-full object-cover" src="/minimi/bg-garden.png" alt="정원과 집 배경" />

              <div className="absolute left-1/2 top-[15px] -translate-x-1/2 max-w-[calc(100%-28px)]">
                <div className="flex flex-col items-end px-[14px] py-1.5 bg-white border-2 border-[#2b1f28] drop-shadow-[2px_2px_0px_#2b1f28]">
                  <p className="m-0 [display:-webkit-box] w-fit max-w-full [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden text-center font-pixel text-sm leading-[1.5] break-words">
                    {reply || `${partnerName}에게 말을 걸어보세요`}
                  </p>
                  <p className="m-0 text-[10px]!">▼</p>
                </div>
              </div>

              <div className="absolute left-1/2 bottom-[10px] -translate-x-1/2 w-[98px] h-[137px]">
                <img className="absolute left-1/2 top-[121px] w-[104px] h-[15px] -translate-x-1/2" src="/minimi/minimi-shadow.svg" alt="" aria-hidden="true" />
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <img className="absolute left-[-42.41%] top-[-12.36%] w-[185.86%] h-[133%] max-w-none" src="/minimi/minimi-character.png" alt={`${partnerName} 미니유`} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full bg-[#d8dee9]">
            <div className="flex justify-between w-full box-border px-2 pt-0.5 pb-1.5 font-pixel text-xs [&_p]:m-0">
              <p>{house?.locks.needsMiniu ? "내 미니유를 만들면 시작해요" : dDay !== null ? `준비 완료 (D+${dDay}일째 사랑 중)` : "준비 완료"}</p>
              <p>{quota ? `대화 잔여 ${quota.remaining}/${quota.limit}` : "확인 중"}</p>
            </div>
            <form className="flex flex-col gap-1 pt-[9px] px-2 pb-2 border-t border-[#4e5968]" onSubmit={submitChat}>
              <div className="flex items-stretch gap-1">
                <div className="relative flex-1 pt-[10px] pr-4 pb-[10px] pl-[10px] bg-white border-2 border-[#2b1f28] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]">
                  <textarea
                    ref={messageRef}
                    className="block w-full h-5 m-0 p-0 resize-none overflow-y-auto border-none outline-none bg-transparent font-pixel text-xs tracking-[0.3px] leading-[1.4] text-[#db2777] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    rows={1}
                    maxLength={150}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    onFocus={() => setIsMessageFocused(true)}
                    onBlur={() => setIsMessageFocused(false)}
                    aria-label={`${partnerName}에게 보낼 메시지`}
                  />
                  {!isMessageFocused && message.length === 0 ? (
                    <div className="absolute inset-0 flex items-center pt-[10px] pr-4 pb-[10px] pl-[10px] pointer-events-none font-pixel text-xs tracking-[0.3px] text-[#db2777]" aria-hidden="true">
                      <span>{partnerName}에게 한마디...</span>
                      <span className="font-['Space_Mono',monospace] text-sm animate-[miniuBlink_1s_steps(1,end)_infinite]">|</span>
                    </div>
                  ) : null}
                </div>
                <button
                  type="submit"
                  disabled={pending || !message.trim()}
                  className="flex self-stretch shrink-0 items-center gap-0.5 px-3 py-2 border-2 border-[#2b1f28] bg-gradient-to-b from-white via-[#accef3] to-[#7cb6f6] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&_p]:m-0 [&_p]:font-['Silkscreen',monospace] [&_p]:font-bold [&_p]:text-xs [&_p]:text-[#191f28]"
                >
                  <p>Send</p>
                  <p className="text-[10px]! font-normal!">▼</p>
                </button>
              </div>
              <p className="m-0 px-1 font-pixel text-xs text-[#333d4b]">{status || `${partnerName} is thinking of you...`}</p>
            </form>
          </div>
        </div>

        {house?.locks.needsMiniu && (
          <div className="flex flex-col gap-2 p-2 bg-white border-2 border-[#2b1f28]">
            <p className="m-0 font-pixel text-xs text-[#191f28]">내 미니유를 만들어주세요</p>
            <input
              className="w-full box-border px-2 py-1.5 border-2 border-[#2b1f28] font-pixel text-xs"
              placeholder="이름을 입력해 주세요"
              maxLength={20}
              value={miniuName}
              onChange={(event) => setMiniuName(event.target.value)}
            />
            <AttributePicker label="프리셋" options={MINIU_PRESETS} value={miniuPreset} onChange={setMiniuPreset} />
            <AttributePicker label="헤어스타일" options={HAIR_STYLES} value={miniuHairStyle} onChange={setMiniuHairStyle} />
            <AttributePicker label="머리색" options={HAIR_COLORS} value={miniuHairColor} onChange={setMiniuHairColor} />
            <AttributePicker label="피부톤" options={SKIN_TONES} value={miniuSkinTone} onChange={setMiniuSkinTone} />
            <AttributePicker label="얼굴형" options={FACE_SHAPES} value={miniuFaceShape} onChange={setMiniuFaceShape} />
            <AttributePicker label="표정" options={EXPRESSIONS} value={miniuExpression} onChange={setMiniuExpression} />
            <ButtonPrimary label="미니유 만들기" disabled={pending || !miniuName.trim()} onClick={submitMiniu} />
          </div>
        )}

        {house?.locks.canVisit && (
          <ButtonPrimary label={`${partnerName}집 놀러가기`} disabled={pending} onClick={() => setShowHousePopup(true)} />
        )}

      </div>

      <nav className="fixed inset-x-0 bottom-0 z-[5] mx-auto flex w-full max-w-[var(--shell-width)] items-center gap-[10px] bg-gradient-to-t from-white via-white/95 to-transparent px-7 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
        <button type="button" className={NAV_ITEM} onClick={() => onNavigate?.("home")}>
          <img src="/minimi/nav-home.png" alt="" aria-hidden="true" />
          <p>홈</p>
        </button>
        <button type="button" className={`${NAV_ITEM} opacity-60`} onClick={() => onNavigate?.("record")}>
          <img src="/minimi/nav-record.png" alt="" aria-hidden="true" />
          <p>기록</p>
        </button>
        <button type="button" className={`${NAV_ITEM} opacity-60`} onClick={() => onNavigate?.("profile")}>
          <img src="/minimi/nav-profile.png" alt="" aria-hidden="true" />
          <p>프로필</p>
        </button>
      </nav>

      {showHousePopup && (
        <>
          <div className="fixed inset-0 bg-[#111] opacity-80 z-10 cursor-pointer" onClick={() => setShowHousePopup(false)} aria-hidden="true" />
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[358px] max-w-[calc(100%-32px)] flex flex-col items-stretch border-2 border-white shadow-[2px_2px_0px_0px_rgba(17,17,17,0.2)] z-[11]"
            role="dialog"
            aria-modal="true"
            aria-label={`${partnerName} 집`}
          >
            <div className={TITLE_BAR}>
              <p>my home.exe - [wellcome!]</p>
              <div className="flex items-center gap-0.5">
                <span className={WINDOW_BTN} aria-hidden="true"><span className="w-2 h-2 border-[1.5px] border-[#111] box-border" /></span>
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
    </div>
  );
}
