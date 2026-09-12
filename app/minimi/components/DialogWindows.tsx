import "./dialogWindows.css";
import { ButtonPopup } from "./Buttons";

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
      className={className ? `miniuDialog ${className}` : "miniuDialog"}
      role="dialog"
      aria-modal="true"
    >
      <div className="miniuDialog__body">
        <div className="miniuDialog__message">
          <p>기존과 비슷한 기록을 발견했습니다.</p>
          <p>같은 정보로 병합할까요?</p>
        </div>
        <p className="miniuDialog__ref">{refLabel}</p>
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
      className={className ? `miniuDialog ${className}` : "miniuDialog"}
      role="dialog"
      aria-modal="true"
    >
      <div className="miniuDialog__body">
        <div className="miniuDialog__message">
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
