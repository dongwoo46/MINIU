import type { ButtonHTMLAttributes } from "react";

const BUTTON_BASE =
  "miniuButton flex items-center justify-center gap-0.5 w-full h-[42px] m-0 px-3 py-2 border-2 border-[#2b1f28] cursor-pointer font-pixel text-xs tracking-[0.3px] text-[#191f28] disabled:opacity-50 disabled:cursor-not-allowed";

type ButtonPrimaryProps = {
  label: string;
  showArrow?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

// Figma node 158:47234 (button_primary)
export function ButtonPrimary({
  label,
  showArrow = true,
  className,
  ...rest
}: ButtonPrimaryProps) {
  return (
    <button
      type="button"
      className={`${BUTTON_BASE} miniuButton--primary bg-gradient-to-b from-white via-[#f296c1] to-[#db2777]${
        className ? ` ${className}` : ""
      }`}
      {...rest}
    >
      <span>{label}</span>
      {showArrow ? (
        <span className="inline-block text-[8px] -rotate-90">▼</span>
      ) : null}
    </button>
  );
}

type ButtonSecondaryProps = {
  label: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

// Figma node 158:47235 (button_secondary)
export function ButtonSecondary({
  label,
  className,
  ...rest
}: ButtonSecondaryProps) {
  return (
    <button
      type="button"
      className={`${BUTTON_BASE} miniuButton--secondary bg-[#d8dee9] border-[1.6px] border-white shadow-[1px_1px_0px_rgba(0,0,0,0.2)]${
        className ? ` ${className}` : ""
      }`}
      {...rest}
    >
      <span>{label}</span>
    </button>
  );
}

type ButtonPairProps = {
  primaryLabel: string;
  secondaryLabel: string;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
};

// Figma node 158:47150 (button_default) — primary+secondary 세트, 화면 하단 여백용 패딩
export function ButtonDefault(props: ButtonPairProps) {
  return (
    <div className="flex flex-col items-stretch gap-1.5 w-full px-4 py-6">
      <ButtonPrimary
        label={props.primaryLabel}
        onClick={props.onPrimaryClick}
      />
      <ButtonSecondary
        label={props.secondaryLabel}
        onClick={props.onSecondaryClick}
      />
    </div>
  );
}

// Figma node 158:47241 (button_popup) — primary+secondary 세트, 팝업 내부용 패딩
export function ButtonPopup(props: ButtonPairProps) {
  return (
    <div className="flex flex-col items-stretch gap-1.5 w-full p-2">
      <ButtonPrimary
        label={props.primaryLabel}
        onClick={props.onPrimaryClick}
      />
      <ButtonSecondary
        label={props.secondaryLabel}
        onClick={props.onSecondaryClick}
      />
    </div>
  );
}
