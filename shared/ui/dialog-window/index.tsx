import { ButtonPopup } from "@/shared/ui/pixel-button";

const DIALOG_BASE =
  "flex flex-col items-stretch w-full max-w-[358px] bg-[#d8dee9] border-2 border-white shadow-[2px_2px_0px_0px_rgba(17,17,17,0.2)]";

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

type DeleteConfirmDialogProps = {
  refLabel: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onDelete?: () => void;
  onCancel?: () => void;
  className?: string;
};

// Figma node 183:51013 (window 3) — 기록 삭제 확인 다이얼로그, 참조 파일 표시 포함
export function DeleteConfirmDialog({
  refLabel,
  primaryLabel = "삭제하기",
  secondaryLabel = "취소",
  onDelete,
  onCancel,
  className,
}: DeleteConfirmDialogProps) {
  return (
    <div
      className={`${DIALOG_BASE}${className ? ` ${className}` : ""}`}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col items-center gap-2 px-2 py-5">
        <div className="m-0 text-center font-pixel text-base tracking-[0.16px] leading-[1.5] text-[#191f28] [&_p]:m-0">
          <p>기록을 삭제할까요?</p>
          <p>기록과 연결된 프로필 카드도 삭제돼요</p>
        </div>
        <p className="m-0 font-pixel text-base tracking-[0.16px] leading-[1.5] text-[#6b7684]">
          {refLabel}
        </p>
      </div>
      <ButtonPopup
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel}
        onPrimaryClick={onDelete}
        onSecondaryClick={onCancel}
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

type EditExitConfirmDialogProps = {
  primaryLabel?: string;
  secondaryLabel?: string;
  onExit?: () => void;
  onCancel?: () => void;
  className?: string;
};

// Figma node 183:53295 (window 4, profile_edit 도중 close) — 저장 안 한 수정 종료 확인 다이얼로그
export function EditExitConfirmDialog({
  primaryLabel = "종료하기",
  secondaryLabel = "취소",
  onExit,
  onCancel,
  className,
}: EditExitConfirmDialogProps) {
  return (
    <div
      className={`${DIALOG_BASE}${className ? ` ${className}` : ""}`}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col items-center gap-2 px-2 py-5">
        <div className="m-0 text-center font-pixel text-base tracking-[0.16px] leading-[1.5] text-[#191f28] [&_p]:m-0">
          <p>수정중이던 정보가 저장되지 않았어요.</p>
          <p>수정을 종료할까요?</p>
        </div>
      </div>
      <ButtonPopup
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel}
        onPrimaryClick={onExit}
        onSecondaryClick={onCancel}
      />
    </div>
  );
}

type ProfileCardSaveConfirmDialogProps = {
  primaryLabel?: string;
  secondaryLabel?: string;
  onSave?: () => void;
  onCancel?: () => void;
  className?: string;
};

// Figma node 183:52694 (window 4, profile_edit popup) — 카드 내용 수정 저장 확인 다이얼로그
export function ProfileCardSaveConfirmDialog({
  primaryLabel = "수정하기",
  secondaryLabel = "취소",
  onSave,
  onCancel,
  className,
}: ProfileCardSaveConfirmDialogProps) {
  return (
    <div
      className={`${DIALOG_BASE}${className ? ` ${className}` : ""}`}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col items-center gap-2 px-2 py-5">
        <div className="m-0 text-center font-pixel text-base tracking-[0.16px] leading-[1.5] text-[#191f28] [&_p]:m-0">
          <p>이전 기록이 아닌,</p>
          <p>수정된 정보가 우선 반영돼요.</p>
          <p>수정할까요?</p>
        </div>
      </div>
      <ButtonPopup
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel}
        onPrimaryClick={onSave}
        onSecondaryClick={onCancel}
      />
    </div>
  );
}

type ProfileCardDeleteDialogProps = {
  primaryLabel?: string;
  secondaryLabel?: string;
  onDelete?: () => void;
  onCancel?: () => void;
  className?: string;
};

// Figma node 183:51764 (window 3, profile_del) — 프로필 카드 삭제 확인 다이얼로그
export function ProfileCardDeleteDialog({
  primaryLabel = "삭제하기",
  secondaryLabel = "취소",
  onDelete,
  onCancel,
  className,
}: ProfileCardDeleteDialogProps) {
  return (
    <div
      className={`${DIALOG_BASE}${className ? ` ${className}` : ""}`}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex flex-col items-center gap-2 px-2 py-5">
        <div className="m-0 text-center font-pixel text-base tracking-[0.16px] leading-[1.5] text-[#191f28] [&_p]:m-0">
          <p>카드를 삭제하면 되돌릴 수 없어요.</p>
          <p>삭제할까요?</p>
        </div>
        <p className="m-0 font-pixel text-xs tracking-[0.3px] leading-[1.3] text-[#6b7684]">
          기록탭의 관련 기록은 사라지지 않아요
        </p>
      </div>
      <ButtonPopup
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel}
        onPrimaryClick={onDelete}
        onSecondaryClick={onCancel}
      />
    </div>
  );
}
