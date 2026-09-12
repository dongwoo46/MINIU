import { ButtonPopup } from "@/shared/ui/pixel-button";

const DIALOG_BASE =
  "flex flex-col items-stretch w-[358px] bg-[#d8dee9] border-2 border-white shadow-[2px_2px_0px_0px_rgba(17,17,17,0.2)]";

type MergeDialogProps = {
  primaryLabel?: string;
  secondaryLabel?: string;
  onMerge?: () => void;
  onDismiss?: () => void;
  className?: string;
};

// Figma node 158:47251 (window 01) — 유사 기록 발견 다이얼로그, 참조 파일 표시 포함
export function Window01({
  refLabel,
  primaryLabel = "텍스트",
  secondaryLabel = "텍스트",
  onMerge,
  onDismiss,
  className,
}: MergeDialogProps & { refLabel: string }) {
  return (
    <div
      className={`${DIALOG_BASE}${className ? ` ${className}` : ""}`}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col items-center gap-2 px-2 py-5">
        <div className="m-0 text-center font-pixel text-base tracking-[0.16px] leading-[1.5] text-[#191f28] [&_p]:m-0">
          <p>기존과 비슷한 기록을 발견했습니다.</p>
          <p>같은 정보로 병합할까요?</p>
        </div>
        <p className="m-0 font-pixel text-base tracking-[0.16px] leading-[1.5] text-[#6b7684]">
          {refLabel}
        </p>
      </div>
      <ButtonPopup
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel}
        onPrimaryClick={onMerge}
        onSecondaryClick={onDismiss}
      />
    </div>
  );
}

// Figma node 157:16233 (window 02) — 유사 기록 발견 다이얼로그, 참조 파일 표시 없음
export function Window02({
  primaryLabel = "텍스트",
  secondaryLabel = "텍스트",
  onMerge,
  onDismiss,
  className,
}: MergeDialogProps) {
  return (
    <div
      className={`${DIALOG_BASE}${className ? ` ${className}` : ""}`}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col items-center gap-2 px-2 py-5">
        <div className="m-0 text-center font-pixel text-base tracking-[0.16px] leading-[1.5] text-[#191f28] [&_p]:m-0">
          <p>기존과 비슷한 기록을 발견했습니다.</p>
          <p>같은 정보로 병합할까요?</p>
        </div>
      </div>
      <ButtonPopup
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel}
        onPrimaryClick={onMerge}
        onSecondaryClick={onDismiss}
      />
    </div>
  );
}
