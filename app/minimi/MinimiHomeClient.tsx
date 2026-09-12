"use client";

import { useState } from "react";
import { truncateBubbleText } from "./lib/text";

const BUBBLE_TEXT =
  '"진우야 오늘도 수고많았어! 오늘 날씨 너무 덥다. 더위 조심해~"';

const INPUT_TEXT =
  "진우야 사랑한다. 진짜로 너무 사랑한다. 앞으로도 잘 부탁해! 진우야 사랑한다. 진짜로 너무 사랑한다. 앞으로도 잘 부탁해!진우야 사랑한다. 진짜로 너무";

export default function MinimiHomeClient() {
  const [showHomePopup, setShowHomePopup] = useState(false);

  return (
    <div className="miniuHome">
      <div className="miniuHome__softlight">
        <img src="/minimi/bg-soft-light.png" alt="" aria-hidden="true" />
      </div>

      <div className="miniuHome__gnb">
        <p className="miniuHome__logo">MINIU</p>

        <div className="miniuHome__gnbIcons">
          <div className="miniuHome__bellIcon" aria-hidden="true">
            <span className="miniuHome__bellRect miniuHome__bellRect--1" />
            <span className="miniuHome__bellRect miniuHome__bellRect--2" />
            <span className="miniuHome__bellRect miniuHome__bellRect--3" />
            <span className="miniuHome__bellRect miniuHome__bellRect--4" />
            <span className="miniuHome__bellRect miniuHome__bellRect--5" />
            <span className="miniuHome__bellRect miniuHome__bellRect--6" />
            <span className="miniuHome__bellRect miniuHome__bellRect--7" />
            <span className="miniuHome__bellRect miniuHome__bellRect--8" />
            <span className="miniuHome__bellRect miniuHome__bellRect--9" />
            <span className="miniuHome__bellRect miniuHome__bellRect--10" />
            <span className="miniuHome__bellRect miniuHome__bellRect--11" />
          </div>

          <div className="miniuHome__gearIcon" aria-hidden="true">
            <div className="miniuHome__gearCrop">
              <img
                className="miniuHome__gearImg"
                src="/minimi/gear-icon.png"
                alt=""
              />
            </div>
            <span className="miniuHome__gearTick miniuHome__gearTick--1" />
            <span className="miniuHome__gearTick miniuHome__gearTick--2" />
            <span className="miniuHome__gearTick miniuHome__gearTick--3" />
            <span className="miniuHome__gearTick miniuHome__gearTick--4" />
            <span className="miniuHome__gearTick miniuHome__gearTick--5" />
            <span className="miniuHome__gearTick miniuHome__gearTick--6" />
            <span className="miniuHome__gearTick miniuHome__gearTick--7" />
            <span className="miniuHome__gearTick miniuHome__gearTick--8" />
          </div>
        </div>
      </div>

      <div className="miniuHome__contents">
        <div className="miniuHome__windowGroup">
          <div className="miniuHome__window">
            <div className="miniuHome__titleBar">
              <p>miniu_home.exe</p>
              <div className="miniuHome__titleBarControls">
                <button type="button" className="miniuHome__windowBtn">
                  <img src="/minimi/window-btn-min.svg" alt="최소화" />
                </button>
                <span className="miniuHome__windowBtn">
                  <span className="miniuHome__windowBtnSquareIcon" aria-hidden="true" />
                </span>
                <button type="button" className="miniuHome__windowBtn">
                  <img
                    className="miniuHome__windowBtnCloseIcon"
                    src="/minimi/window-btn-close.svg"
                    alt="닫기"
                  />
                </button>
              </div>
            </div>

            <div className="miniuHome__menuStrip">
              <p>파일(F)</p>
              <p>동작(A)</p>
              <p>보기(V)</p>
              <p>도움말(H)</p>
            </div>

            <div className="miniuHome__imgArea">
              <div className="miniuHome__stage">
                <img
                  className="miniuHome__stageBg"
                  src="/minimi/bg-garden.png"
                  alt="정원과 집 배경"
                />

                <div className="miniuHome__overlay">
                  <div className="miniuHome__bubble">
                    <p className="miniuHome__bubbleText">
                      {truncateBubbleText(BUBBLE_TEXT)}
                    </p>
                    <p className="miniuHome__bubbleTail">▼</p>
                  </div>
                </div>

                <div className="miniuHome__minimi">
                  <img
                    className="miniuHome__minimiShadow"
                    src="/minimi/minimi-shadow.svg"
                    alt=""
                    aria-hidden="true"
                  />
                  <div className="miniuHome__minimiCharCrop">
                    <img
                      className="miniuHome__minimiChar"
                      src="/minimi/minimi-character.png"
                      alt="미니미 캐릭터"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="miniuHome__underbar">
              <div className="miniuHome__statusLine">
                <p>준비 완료 (D+342일째 사랑 중)</p>
                <p>대화 잔여 18/20</p>
              </div>
              <div className="miniuHome__inputRow">
                <div className="miniuHome__inputWrap">
                  <div className="miniuHome__inputBox">
                    <textarea
                      className="miniuHome__input"
                      maxLength={100}
                      defaultValue={INPUT_TEXT}
                      aria-label="진우에게 보낼 메시지 (최대 100자)"
                    />
                    <div className="miniuHome__scrollTrack" aria-hidden="true">
                      <div className="miniuHome__scrollThumb" />
                    </div>
                  </div>
                  <button type="button" className="miniuHome__sendBtn">
                    <p>Send</p>
                    <p className="miniuHome__sendArrow">▼</p>
                  </button>
                </div>
                <p className="miniuHome__thinking">
                  miniu is thinking of you...
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="miniuHome__banner"
            onClick={() => setShowHomePopup(true)}
          >
            <p>진우 집 놀러가기</p>
            <p className="miniuHome__bannerArrow">▼</p>
          </button>
        </div>
      </div>

      <nav className="miniuHome__nav">
        <button type="button" className="miniuHome__navItem">
          <img src="/minimi/nav-home.png" alt="" aria-hidden="true" />
          <p>홈</p>
        </button>
        <button
          type="button"
          className="miniuHome__navItem miniuHome__navItem--inactive"
        >
          <img src="/minimi/nav-record.png" alt="" aria-hidden="true" />
          <p>기록</p>
        </button>
        <button
          type="button"
          className="miniuHome__navItem miniuHome__navItem--inactive"
        >
          <img src="/minimi/nav-profile.png" alt="" aria-hidden="true" />
          <p>프로필</p>
        </button>
      </nav>

      <div className="miniuHome__homeIndicator">
        <div className="miniuHome__homeIndicatorBar" />
      </div>

      {showHomePopup ? (
        <>
          <div
            className="miniuHome__dim"
            onClick={() => setShowHomePopup(false)}
            aria-hidden="true"
          />

          <div
            className="miniuHome__popupWindow"
            role="dialog"
            aria-modal="true"
            aria-label="진우 집"
          >
            <div className="miniuHome__titleBar">
              <p>my home.exe - [wellcome!]</p>
              <div className="miniuHome__titleBarControls">
                <button type="button" className="miniuHome__windowBtn">
                  <img src="/minimi/window-btn-min.svg" alt="최소화" />
                </button>
                <span className="miniuHome__windowBtn">
                  <span className="miniuHome__windowBtnSquareIcon" aria-hidden="true" />
                </span>
                <button
                  type="button"
                  className="miniuHome__windowBtn"
                  onClick={() => setShowHomePopup(false)}
                >
                  <img
                    className="miniuHome__windowBtnCloseIcon"
                    src="/minimi/window-btn-close.svg"
                    alt="팝업 닫기"
                  />
                </button>
              </div>
            </div>

            <div className="miniuHome__popupNotice">
              <div className="miniuHome__noticeBar">
                <img
                  className="miniuHome__noticeBell"
                  src="/minimi/bell-ring.svg"
                  alt=""
                  aria-hidden="true"
                />
                <p>어제 진우가 꼬옥 안아주고 갔어요!</p>
              </div>
            </div>

            <div className="miniuHome__popupImgArea">
              <div className="miniuHome__popupStage">
                <img
                  className="miniuHome__popupStageBg"
                  src="/minimi/room-bg.png"
                  alt="진우의 방"
                />

                <div className="miniuHome__popupMinimi">
                  <img
                    className="miniuHome__minimiShadow"
                    src="/minimi/popup-minimi-shadow.svg"
                    alt=""
                    aria-hidden="true"
                  />
                  <div className="miniuHome__minimiCharCrop">
                    <img
                      className="miniuHome__minimiChar"
                      src="/minimi/minimi-character.png"
                      alt="미니미 캐릭터"
                    />
                  </div>
                </div>
              </div>

              <div className="miniuHome__popupUnderbar">
                <div className="miniuHome__interactionButtons">
                  <button type="button" className="miniuHome__interactionBtn">
                    <span className="miniuHome__heartCrop miniuHome__heartCrop--lg">
                      <img
                        className="miniuHome__heartImg"
                        src="/minimi/heart-icon.png"
                        alt=""
                        aria-hidden="true"
                      />
                    </span>
                    <span className="miniuHome__interactionLabel">
                      <span>쓰다듬기</span>
                      <span className="miniuHome__interactionArrow">▼</span>
                    </span>
                  </button>
                  <button type="button" className="miniuHome__interactionBtn">
                    <span className="miniuHome__heartCrop miniuHome__heartCrop--sm">
                      <img
                        className="miniuHome__heartImg"
                        src="/minimi/heart-icon.png"
                        alt=""
                        aria-hidden="true"
                      />
                    </span>
                    <span className="miniuHome__interactionLabel">
                      <span>안아주기</span>
                      <span className="miniuHome__interactionArrow">▼</span>
                    </span>
                  </button>
                  <button type="button" className="miniuHome__interactionBtn">
                    <span className="miniuHome__heartCrop miniuHome__heartCrop--sm">
                      <img
                        className="miniuHome__heartImg"
                        src="/minimi/heart-icon.png"
                        alt=""
                        aria-hidden="true"
                      />
                    </span>
                    <span className="miniuHome__interactionLabel">
                      <span>뽀뽀하기</span>
                      <span className="miniuHome__interactionArrow">▼</span>
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  className="miniuHome__popupCloseBtn"
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
