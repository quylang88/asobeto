"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type LessonButtonTone = "brand" | "danger";

interface LessonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: LessonButtonTone;
  className?: string;
  frontClassName?: string;
  children: ReactNode;
}

const TONE_CLASS_MAP: Record<LessonButtonTone, { back: string; front: string }> = {
  brand: {
    back: "bg-orange-bright",
    front: "bg-green-bright text-white",
  },
  danger: {
    back: "bg-red-600",
    front: "bg-red-500 text-white",
  },
};

function joinClassNames(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}

export function LessonButton({
  tone = "brand",
  className,
  frontClassName,
  children,
  disabled,
  ...props
}: LessonButtonProps) {
  const toneClass = TONE_CLASS_MAP[tone];
  const buttonType = props.type ?? "button";

  return (
    <button
      {...props}
      type={buttonType}
      disabled={disabled}
      className={joinClassNames(
        "relative ios-button",
        disabled ? "pointer-events-none opacity-60" : "",
        className,
      )}
    >
      {/* Tạo lớp đổ bóng màu cam/đỏ để giữ cảm giác nổi khối đồng bộ */}
      <span
        aria-hidden
        className={joinClassNames(
          "absolute inset-0 rounded-[inherit] translate-y-1.5 transition-transform",
          toneClass.back,
        )}
      />
      {/* Lớp chính màu xanh/đỏ hiển thị nội dung của nút */}
      <span
        className={joinClassNames(
          "relative flex items-center justify-center rounded-[inherit] font-bold",
          toneClass.front,
          frontClassName,
        )}
      >
        {children}
      </span>
    </button>
  );
}
