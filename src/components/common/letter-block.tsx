import { Lock } from "lucide-react";

type LetterBlockSize = "sm" | "md";

interface LetterBlockProps {
  letter: string;
  color: string;
  size?: LetterBlockSize;
  locked?: boolean;
  className?: string;
  lowercase?: boolean;
}

const SIZE_STYLES: Record<
  LetterBlockSize,
  {
    block: string;
    rounded: string;
    shadowOffset: string;
    font: string;
    highlight: string;
    lockIcon: string;
  }
> = {
  sm: {
    block: "w-10 h-10",
    rounded: "rounded-lg",
    shadowOffset: "translate-y-0.5",
    font: "text-2xl",
    highlight: "top-1 left-1 right-3 h-1.5",
    lockIcon: "w-5 h-5",
  },
  md: {
    block: "w-14 h-14",
    rounded: "rounded-xl",
    shadowOffset: "translate-y-1",
    font: "text-[2.25rem]",
    highlight: "top-1 left-1 right-3 h-2",
    lockIcon: "w-7 h-7",
  },
};

export function LetterBlock({
  letter,
  color,
  size = "md",
  locked = false,
  className = "",
  lowercase = false,
}: LetterBlockProps) {
  const styles = SIZE_STYLES[size];
  const normalizedLetter = lowercase ? letter.toLocaleLowerCase() : letter;
  const displayLetter = normalizedLetter.trim().charAt(0) || "?";

  return (
    <div className={`${styles.block} relative ${className}`}>
      <div
        className={`absolute inset-0 ${styles.rounded} transform ${styles.shadowOffset}`}
        style={{ backgroundColor: color, filter: "brightness(0.6)" }}
      />
      <div
        className={`absolute inset-0 ${styles.rounded} flex items-center justify-center ${styles.font} font-hp-special leading-none text-white shadow-lg`}
        style={{
          backgroundColor: color,
          textShadow:
            "0 1px 0 rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.25), 0 0 10px rgba(255,255,255,0.35)",
        }}
      >
        {displayLetter}
      </div>
      <div
        className={`absolute ${styles.highlight} rounded-full opacity-40`}
        style={{ backgroundColor: "white" }}
      />
      {locked && (
        <div
          className={`absolute inset-0 ${styles.rounded} bg-gray-700/95 flex items-center justify-center`}
        >
          <Lock className={`${styles.lockIcon} text-gray-200`} />
        </div>
      )}
    </div>
  );
}
