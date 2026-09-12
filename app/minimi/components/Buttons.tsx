import type { ButtonHTMLAttributes } from "react";
import "./buttons.css";

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
      className={
        className
          ? `miniuButton miniuButton--primary ${className}`
          : "miniuButton miniuButton--primary"
      }
      {...rest}
    >
      <span>{label}</span>
      {showArrow ? <span className="miniuButton__arrow">▼</span> : null}
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
      className={
        className
          ? `miniuButton miniuButton--secondary ${className}`
          : "miniuButton miniuButton--secondary"
      }
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
    <div className="miniuButtonGroup miniuButtonGroup--default">
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
    <div className="miniuButtonGroup miniuButtonGroup--popup">
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
