"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { truncateBubbleText } from "./lib/text";
import { ButtonPrimary } from "./components/Buttons";

const BUBBLE_TEXT =
  '"진우야 오늘도 수고많았어! 오늘 날씨 너무 덥다. 더위 조심해~"';

const TITLE_BAR =
  "flex items-center justify-between px-2 py-1 border-b-2 border-[#4e5968] bg-gradient-to-r from-[#5376c7] via-[#5c82db] to-[#456cb8] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-xs [&_p]:text-white [&_p]:tracking-[0.3px]";
const WINDOW_BTN =
  "flex items-center justify-center w-4 h-4 p-0 border-2 border-white bg-[#d8dee9] cursor-pointer";

export default function MinimiHomeClient() {
  const [showHomePopup, setShowHomePopup] = useState(false);
  const [message, setMessage] = useState("");
  const [isMessageFocused, setIsMessageFocused] = useState(false);
  const [isMessageOverflowing, setIsMessageOverflowing] = useState(false);
  const [thumbStyle, setThumbStyle] = useState({ top: 0, height: 37 });
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const messageTrackRef = useRef<HTMLDivElement>(null);
  const MIN_THUMB_HEIGHT = 24;
  // 기본 1줄(박스 전체 40px = 콘텐츠 20px + 상하 패딩 20px), 2줄부터 늘어나
  // 최대 박스 84px(콘텐츠 64px)까지 커지고 그 이상은 스크롤 처리한다.
  const INPUT_MIN_CONTENT_HEIGHT = 20;
  const INPUT_MAX_CONTENT_HEIGHT = 64;

  function updateThumbPosition() {
    const el = messageRef.current;
    if (!el) return;
    // 트랙(스크롤 트랙)은 inputBox 패딩까지 포함해 textarea보다
    // 크므로, 손잡이가 트랙 끝까지 닿으려면 트랙 자체의 실제 높이를 재야 한다.
    const trackHeight = messageTrackRef.current?.clientHeight ?? el.clientHeight;
    const thumbHeight = Math.max(
      MIN_THUMB_HEIGHT,
      (el.clientHeight / el.scrollHeight) * trackHeight
    );
    const maxScrollTop = el.scrollHeight - el.clientHeight;
    const maxThumbTop = trackHeight - thumbHeight;
    const thumbTop =
      maxScrollTop > 0 ? (el.scrollTop / maxScrollTop) * maxThumbTop : 0;

    setThumbStyle({ top: thumbTop, height: thumbHeight });
  }

  function resizeMessageInput() {
    const el = messageRef.current;
    if (!el) return;

    el.style.height = "auto";
    const naturalHeight = el.scrollHeight;
    const nextHeight = Math.min(
      Math.max(naturalHeight, INPUT_MIN_CONTENT_HEIGHT),
      INPUT_MAX_CONTENT_HEIGHT
    );
    el.style.height = `${nextHeight}px`;

    const overflowing = naturalHeight > INPUT_MAX_CONTENT_HEIGHT;
    setIsMessageOverflowing(overflowing);
    if (overflowing) updateThumbPosition();
  }

  useEffect(() => {
    resizeMessageInput();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  useEffect(() => {
    // 트랙이 방금 화면에 나타난 시점(ref가 이제 막 붙은 시점)에도 트랙의
    // 실제 높이로 다시 계산해서 손잡이가 트랙 끝까지 닿게 한다.
    if (isMessageOverflowing) updateThumbPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMessageOverflowing]);

  return (
    <div className="relative w-[390px] h-[844px] mx-auto overflow-hidden bg-gradient-to-b from-[#7cb6f6] via-[#e9f9ff] to-white text-[#191f28] font-[Arial,Helvetica,sans-serif]">
      <div className="absolute left-0 top-0 w-[390px] h-[844px] overflow-hidden">
        <img
          className="absolute left-[-7px] top-[-3px] w-[404px] h-[404px] object-cover mix-blend-soft-light opacity-30 rotate-180"
          src="/minimi/bg-soft-light.png"
          alt=""
          aria-hidden="true"
        />
      </div>

      <div className="absolute left-0 top-[59px] w-[390px] h-[50px] overflow-hidden">
        <p className="absolute left-4 top-1/2 -translate-y-1/2 m-0 font-pixel text-[36px] text-white tracking-[-0.72px] leading-none whitespace-nowrap">
          MINIU
        </p>

        <div className="absolute left-[294px] top-[7px] flex items-center gap-2">
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
          </div>

          <div className="relative w-9 h-9" aria-hidden="true">
            <div className="absolute left-[1.93px] top-[1.93px] w-[32.143px] h-[32.143px] overflow-hidden">
              <img
                className="absolute left-[-83.33%] top-[-71.46%] w-[268%] h-[244.92%] max-w-none"
                src="/minimi/gear-icon.png"
                alt=""
              />
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

      <div className="absolute left-0 top-[135px] w-[390px] flex flex-col items-center gap-[30px]">
        <div className="flex flex-col items-start gap-4 w-[358px]">
          <div className="flex flex-col w-full border-2 border-[#2b1f28] shadow-[2px_2px_0px_0px_rgba(17,17,17,0.2)]">
            <div className={TITLE_BAR}>
              <p>miniu_home.exe</p>
              <div className="flex items-center gap-0.5">
                <button type="button" className={WINDOW_BTN}>
                  <img
                    className="w-[10px] h-[10px]"
                    src="/minimi/window-btn-min.svg"
                    alt="최소화"
                  />
                </button>
                <span className={WINDOW_BTN}>
                  <span
                    className="w-2 h-2 border-[1.5px] border-[#111] box-border"
                    aria-hidden="true"
                  />
                </span>
                <button type="button" className={WINDOW_BTN}>
                  <img
                    className="w-[6.124px] h-[6.124px]"
                    src="/minimi/window-btn-close.svg"
                    alt="닫기"
                  />
                </button>
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
                <img
                  className="w-full h-full object-cover"
                  src="/minimi/bg-garden.png"
                  alt="정원과 집 배경"
                />

                <div className="absolute left-1/2 top-[15px] -translate-x-1/2">
                  <div className="flex flex-col items-end w-[300px] px-[14px] py-1.5 bg-white border-2 border-[#2b1f28] drop-shadow-[2px_2px_0px_#2b1f28]">
                    <p className="m-0 [display:-webkit-box] w-fit max-w-full [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden text-center font-pixel text-sm leading-[1.5] break-words">
                      {truncateBubbleText(BUBBLE_TEXT)}
                    </p>
                    <p className="m-0 text-[10px]!">▼</p>
                  </div>
                </div>

                <div className="absolute left-1/2 bottom-[10px] -translate-x-1/2 w-[98px] h-[137px]">
                  <img
                    className="absolute left-1/2 top-[121px] w-[104px] h-[15px] -translate-x-1/2"
                    src="/minimi/minimi-shadow.svg"
                    alt=""
                    aria-hidden="true"
                  />
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img
                      className="absolute left-[-42.41%] top-[-12.36%] w-[185.86%] h-[133%] max-w-none"
                      src="/minimi/minimi-character.png"
                      alt="미니미 캐릭터"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col w-[354px] bg-[#d8dee9]">
              <div className="flex justify-between w-[354px] box-border px-2 pt-0.5 pb-1.5 font-pixel text-xs [&_p]:m-0">
                <p>준비 완료 (D+342일째 사랑 중)</p>
                <p>대화 잔여 18/20</p>
              </div>
              <div className="flex flex-col gap-1 pt-[9px] px-2 pb-2 border-t border-[#4e5968]">
                <div className="flex items-stretch gap-1">
                  <div className="relative flex-1 pt-[10px] pr-4 pb-[10px] pl-[10px] bg-white border-2 border-[#2b1f28] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]">
                    <textarea
                      ref={messageRef}
                      className="block w-full h-5 m-0 p-0 resize-none overflow-y-auto border-none outline-none bg-transparent font-pixel text-xs tracking-[0.3px] leading-[1.4] text-[#db2777] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                      rows={1}
                      maxLength={100}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onScroll={updateThumbPosition}
                      onFocus={() => setIsMessageFocused(true)}
                      onBlur={() => setIsMessageFocused(false)}
                      aria-label="진우에게 보낼 메시지 (최대 100자)"
                    />
                    {!isMessageFocused && message.length === 0 ? (
                      <div
                        className="absolute inset-0 flex items-center pt-[10px] pr-4 pb-[10px] pl-[10px] pointer-events-none font-pixel text-xs tracking-[0.3px] text-[#db2777]"
                        aria-hidden="true"
                      >
                        <span>진우에게 사랑의 메시지...</span>
                        <span className="font-['Space_Mono',monospace] text-sm animate-[miniuBlink_1s_steps(1,end)_infinite]">
                          |
                        </span>
                      </div>
                    ) : null}
                    {isMessageOverflowing ? (
                      <div
                        ref={messageTrackRef}
                        className="absolute right-0 top-0 bottom-0 w-[6px] bg-[#b0b8c1] border-l-2 border-[#2b1f28]"
                        aria-hidden="true"
                      >
                        <div
                          className="absolute left-0 w-full bg-white border-t-2 border-b-2 border-[#2b1f28]"
                          style={{
                            top: `${thumbStyle.top}px`,
                            height: `${thumbStyle.height}px`,
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    className="flex self-stretch shrink-0 items-center gap-0.5 px-3 py-2 border-2 border-[#2b1f28] bg-gradient-to-b from-white via-[#accef3] to-[#7cb6f6] cursor-pointer [&_p]:m-0 [&_p]:font-['Silkscreen',monospace] [&_p]:font-bold [&_p]:text-xs [&_p]:text-[#191f28]"
                  >
                    <p>Send</p>
                    <p className="text-[10px]! font-normal!">▼</p>
                  </button>
                </div>
                <p className="m-0 px-1 font-pixel text-xs text-[#333d4b]">
                  miniu is thinking of you...
                </p>
              </div>
            </div>
          </div>

          <ButtonPrimary
            label="진우 집 놀러가기"
            onClick={() => setShowHomePopup(true)}
          />
        </div>
      </div>

      <nav className="absolute left-0 bottom-[34px] flex items-center gap-[10px] w-[390px] px-7">
        <button
          type="button"
          className="flex-1 flex flex-col items-center gap-1 px-[10px] py-1.5 border-none bg-transparent no-underline cursor-pointer [&_img]:w-[46px] [&_img]:h-[46px] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-base [&_p]:text-[#191f28]"
        >
          <img src="/minimi/nav-home.png" alt="" aria-hidden="true" />
          <p>홈</p>
        </button>
        <Link
          href="/minimi/note"
          className="flex-1 flex flex-col items-center gap-1 px-[10px] py-1.5 border-none bg-transparent no-underline cursor-pointer opacity-60 [&_img]:w-[46px] [&_img]:h-[46px] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-base [&_p]:text-[#191f28]"
        >
          <img src="/minimi/nav-record.png" alt="" aria-hidden="true" />
          <p>기록</p>
        </Link>
        <button
          type="button"
          className="flex-1 flex flex-col items-center gap-1 px-[10px] py-1.5 border-none bg-transparent no-underline cursor-pointer opacity-60 [&_img]:w-[46px] [&_img]:h-[46px] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-base [&_p]:text-[#191f28]"
        >
          <img src="/minimi/nav-profile.png" alt="" aria-hidden="true" />
          <p>프로필</p>
        </button>
      </nav>

      <div className="absolute left-0 bottom-0 w-[390px] h-[34px]">
        <div className="absolute left-1/2 bottom-2 -translate-x-1/2 w-[134px] h-[5px] rounded-[100px] bg-black" />
      </div>

      {showHomePopup ? (
        <>
          <div
            className="absolute left-0 top-0 w-[390px] h-[844px] bg-[#111] opacity-80 z-10 cursor-pointer"
            onClick={() => setShowHomePopup(false)}
            aria-hidden="true"
          />

          <div
            className="absolute left-4 top-[185px] w-[358px] flex flex-col items-stretch border-2 border-white shadow-[2px_2px_0px_0px_rgba(17,17,17,0.2)] z-[11]"
            role="dialog"
            aria-modal="true"
            aria-label="진우 집"
          >
            <div className={TITLE_BAR}>
              <p>my home.exe - [wellcome!]</p>
              <div className="flex items-center gap-0.5">
                <button type="button" className={WINDOW_BTN}>
                  <img
                    className="w-[10px] h-[10px]"
                    src="/minimi/window-btn-min.svg"
                    alt="최소화"
                  />
                </button>
                <span className={WINDOW_BTN}>
                  <span
                    className="w-2 h-2 border-[1.5px] border-[#111] box-border"
                    aria-hidden="true"
                  />
                </span>
                <button
                  type="button"
                  className={WINDOW_BTN}
                  onClick={() => setShowHomePopup(false)}
                >
                  <img
                    className="w-[6.124px] h-[6.124px]"
                    src="/minimi/window-btn-close.svg"
                    alt="팝업 닫기"
                  />
                </button>
              </div>
            </div>

            <div className="w-full p-2 bg-[#d8dee9]">
              <div className="flex items-center gap-1 w-full p-[10px] bg-white border-2 border-[#2b1f28]">
                <img
                  className="shrink-0 w-[14px] h-[14px]"
                  src="/minimi/bell-ring.svg"
                  alt=""
                  aria-hidden="true"
                />
                <p className="flex-1 min-w-0 m-0 font-pixel text-xs tracking-[0.3px] text-[#db2777]">
                  어제 진우가 꼬옥 안아주고 갔어요!
                </p>
              </div>
            </div>

            <div className="w-full px-2 py-1 bg-[#d8dee9]">
              <div className="relative w-full h-[236px] overflow-hidden border-2 border-[#191f28]">
                <img
                  className="w-full h-full object-cover object-top"
                  src="/minimi/room-bg.png"
                  alt="진우의 방"
                />

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
                      alt="미니미 캐릭터"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-5 w-full pt-2 px-2 pb-1.5 bg-[#d8dee9]">
                <div className="flex justify-center gap-[10px] w-full">
                  <button
                    type="button"
                    className="w-[106.33px] shrink-0 flex flex-col items-center justify-center gap-0.5 h-[76px] px-0.5 py-2 border-2 border-white bg-gradient-to-b from-white via-[#accef3] to-[#7cb6f6] shadow-[2px_2px_0px_rgba(17,17,17,0.2)] cursor-pointer"
                  >
                    <span className="relative overflow-hidden shrink-0 w-[26px] h-[24px]">
                      <img
                        className="absolute left-[-87.05%] top-[-49.84%] w-[274.41%] h-[199.36%] max-w-none"
                        src="/minimi/heart-icon.png"
                        alt=""
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex items-center gap-0.5 font-pixel text-sm tracking-[0.196px] text-[#2b1f28]">
                      <span>쓰다듬기</span>
                      <span className="text-[10px]">▼</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="w-[106.33px] shrink-0 flex flex-col items-center justify-center gap-0.5 h-[76px] px-0.5 py-2 border-2 border-white bg-gradient-to-b from-white via-[#accef3] to-[#7cb6f6] shadow-[2px_2px_0px_rgba(17,17,17,0.2)] cursor-pointer"
                  >
                    <span className="relative overflow-hidden shrink-0 w-6 h-[22px]">
                      <img
                        className="absolute left-[-87.05%] top-[-49.84%] w-[274.41%] h-[199.36%] max-w-none"
                        src="/minimi/heart-icon.png"
                        alt=""
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex items-center gap-0.5 font-pixel text-sm tracking-[0.196px] text-[#2b1f28]">
                      <span>안아주기</span>
                      <span className="text-[10px]">▼</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="w-[106.33px] shrink-0 flex flex-col items-center justify-center gap-0.5 h-[76px] px-0.5 py-2 border-2 border-white bg-gradient-to-b from-white via-[#accef3] to-[#7cb6f6] shadow-[2px_2px_0px_rgba(17,17,17,0.2)] cursor-pointer"
                  >
                    <span className="relative overflow-hidden shrink-0 w-6 h-[22px]">
                      <img
                        className="absolute left-[-87.05%] top-[-49.84%] w-[274.41%] h-[199.36%] max-w-none"
                        src="/minimi/heart-icon.png"
                        alt=""
                        aria-hidden="true"
                      />
                    </span>
                    <span className="flex items-center gap-0.5 font-pixel text-sm tracking-[0.196px] text-[#2b1f28]">
                      <span>뽀뽀하기</span>
                      <span className="text-[10px]">▼</span>
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  className="w-[338px] h-[41px] border-2 border-white bg-[#d8dee9] shadow-[1px_1px_0px_rgba(0,0,0,0.2)] font-pixel text-sm tracking-[0.196px] text-[#333d4b] cursor-pointer"
                  onClick={() => setShowHomePopup(false)}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
