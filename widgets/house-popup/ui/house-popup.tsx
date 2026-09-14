"use client";

import { useState } from "react";
import { sendAffection } from "@/shared/api/miniu";
import { Icon } from "@/shared/ui/icon";

const TITLE_BAR =
  "flex items-center justify-between px-2 py-1 border-b-2 border-[#4e5968] bg-gradient-to-r from-[#5376c7] via-[#5c82db] to-[#456cb8] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-xs [&_p]:text-white [&_p]:tracking-[0.3px]";
const WINDOW_BTN =
  "flex items-center justify-center w-4 h-4 p-0 border-2 border-white bg-[#d8dee9] cursor-pointer";
const AFFECTION_BUTTON =
  "flex-1 flex flex-col items-center justify-center gap-0.5 h-[76px] px-0.5 py-2 border-2 border-white bg-gradient-to-b from-white via-[#accef3] to-[#7cb6f6] shadow-[2px_2px_0px_rgba(17,17,17,0.2)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const AFFECTION_PHRASES: Record<"pat" | "hug" | "kiss", string[]> = {
  pat: ["헤헷 쓰담쓰담 좋아!", "기분이 몽글몽글해져~", "한 번 더 쓰다듬어줘!", "손길이 따뜻해서 좋아"],
  hug: ["꼭 안아주니까 든든해!", "이대로 계속 있고 싶어~", "포근포근 행복해!", "심장이 콩닥콩닥해"],
  kiss: ["뽀뽀해줘서 고마워 ♥", "얼굴이 빨개졌어 >_<", "두근두근 설레어!", "한 번 더 해줄래?"],
};

function pickAffectionPhrase(affectionType: "pat" | "hug" | "kiss", lastPhrase: string): string {
  const pool = AFFECTION_PHRASES[affectionType];
  const candidates = pool.filter((phrase) => phrase !== lastPhrase);
  const options = candidates.length > 0 ? candidates : pool;
  return options[Math.floor(Math.random() * options.length)];
}

// 홈 화면의 "OO집 놀러가기"와 알림 화면의 애정 시그널 카드 양쪽에서 공유하는 팝업.
// 어느 화면 위에 떠도 닫으면 그 화면으로 그대로 돌아가도록 자기 자신의 열림 상태를 갖지 않고
// 부모가 onClose로 닫도록 한다(내부 상태는 애정 인터랙션 결과만 들고 있음).
export function HousePopup({ partnerName, onClose, devMock = false }: { partnerName: string; onClose: () => void; devMock?: boolean }) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const [affectionBubble, setAffectionBubble] = useState("");
  const [affectionEffectKey, setAffectionEffectKey] = useState(0);

  async function handleAffection(affectionType: "hug" | "kiss" | "pat") {
    setPending(true);
    setStatus("");
    try {
      if (!devMock) {
        await sendAffection(affectionType);
      }
      setStatus("마음을 보냈어요.");
      setAffectionBubble(pickAffectionPhrase(affectionType, affectionBubble));
      setAffectionEffectKey((key) => key + 1);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "마음을 보내지 못했어요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-[#111] opacity-80 z-10 cursor-pointer" onClick={onClose} aria-hidden="true" />
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
              <img className="w-[10px] h-[10px]" src="/minimi/window-btn-min.svg" alt="" />
            </span>
            <span className={WINDOW_BTN} aria-hidden="true">
              <span className="w-2 h-2 border-[1.5px] border-[#111] box-border" />
            </span>
            <button type="button" className={WINDOW_BTN} onClick={onClose} aria-label="팝업 닫기">
              <img className="w-[6.124px] h-[6.124px]" src="/minimi/window-btn-close.svg" alt="" />
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
            {affectionBubble && (
              <div className="absolute left-1/2 top-[7.4px] -translate-x-1/2 max-w-[300px] z-[1] flex flex-col items-end px-2 py-1.5 bg-white border-2 border-[#2b1f28] drop-shadow-[2px_2px_0px_#2b1f28]">
                <p className="m-0 w-fit max-w-full font-pixel text-sm tracking-[0.196px] text-[#191f28] text-center break-words">{affectionBubble}</p>
                <p className="m-0 text-[10px]!" aria-hidden="true">▼</p>
              </div>
            )}
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
              {affectionEffectKey > 0 && (
                <div key={affectionEffectKey} className="absolute inset-0 pointer-events-none" aria-hidden="true">
                  <span className="affection-heart" style={{ left: "10%", animationDelay: "0ms" }}>♥</span>
                  <span className="affection-heart" style={{ left: "45%", animationDelay: "120ms" }}>♥</span>
                  <span className="affection-heart" style={{ left: "75%", animationDelay: "240ms" }}>♥</span>
                </div>
              )}
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
              onClick={onClose}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
