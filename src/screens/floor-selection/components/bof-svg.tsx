type BofMood = "idle" | "open" | "chew" | "sad";

interface BofSvgProps {
  mood?: BofMood;
}

export function BofSvg({ mood = "idle" }: BofSvgProps) {
  const isSad = mood === "sad";
  const isOpen = mood === "open";
  const isChew = mood === "chew";

  return (
    <svg
      viewBox="0 0 64 64"
      className="relative z-10 h-full w-full p-1.5 drop-shadow-[0_2px_4px_rgba(124,45,18,0.28)]"
      aria-label="Bò"
      role="img"
    >
      <path
        d="M18 18 C15 12, 18 8, 23 9 C23 13, 21 16, 18 18 Z"
        fill="#FDE68A"
      />
      <path
        d="M46 18 C49 12, 46 8, 41 9 C41 13, 43 16, 46 18 Z"
        fill="#FDE68A"
      />

      <ellipse
        cx="14.5"
        cy="30"
        rx="3.8"
        ry="7"
        fill="#F97316"
        transform="rotate(-18 14.5 30)"
      />
      <ellipse
        cx="49.5"
        cy="30"
        rx="3.8"
        ry="7"
        fill="#F97316"
        transform="rotate(18 49.5 30)"
      />

      <ellipse cx="32" cy="33" rx="20.5" ry="17.2" fill="#FB923C" />

      <path
        d="M18 32 C20 25, 30 25, 28 34 C26 39, 19 39, 18 32 Z"
        fill="#FDE68A"
        opacity="0.94"
      />
      <path
        d="M36 28 C41 23, 49 27, 46.5 34 C44 38, 38 36, 36 28 Z"
        fill="#FED7AA"
        opacity="0.95"
      />

      <ellipse cx="26" cy="31.2" rx="4.3" ry="3.1" fill="#FFEDD5" opacity="0.95" />
      <ellipse cx="38" cy="31.2" rx="4.3" ry="3.1" fill="#FFEDD5" opacity="0.95" />

      <ellipse cx="32" cy="41.3" rx="10.5" ry="6.9" fill="#FDBA74" />
      <circle cx="28.4" cy="41.1" r="1.35" fill="#9A3412" />
      <circle cx="35.6" cy="41.1" r="1.35" fill="#9A3412" />

      {!isSad && (
        <>
          <circle cx="26" cy="31.1" r={isOpen ? 2.05 : 1.7} fill="#7C2D12" />
          <circle cx="38" cy="31.1" r={isOpen ? 2.05 : 1.7} fill="#7C2D12" />
          {!isOpen && (
            <>
              <path
                d="M23.2 29.3 Q26 27.6 28.8 29.3"
                stroke="#9A3412"
                strokeWidth="1.15"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M35.2 29.3 Q38 27.6 40.8 29.3"
                stroke="#9A3412"
                strokeWidth="1.15"
                fill="none"
                strokeLinecap="round"
              />
            </>
          )}
        </>
      )}

      {isSad && (
        <>
          <path
            d="M23.4 31.8 Q26 29.4 28.6 31.8"
            stroke="#7C2D12"
            strokeWidth="1.75"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M35.4 31.8 Q38 29.4 40.6 31.8"
            stroke="#7C2D12"
            strokeWidth="1.75"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="40.4" cy="34.6" r="1.15" fill="#60A5FA" opacity="0.9" />
        </>
      )}

      {!isOpen && !isSad && !isChew && (
        <path
          d="M27.2 46 Q32 49.4 36.8 46"
          stroke="#7C2D12"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      )}

      {isChew && (
        <>
          <path
            d="M26.8 46.2 Q31.6 49.3 36.4 45.8"
            stroke="#7C2D12"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M38.8 45.4 l2.4 1.4"
            stroke="#9A3412"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )}

      {isOpen && (
        <>
          <ellipse cx="32" cy="46.2" rx="4.3" ry="3.4" fill="#7C2D12" />
          <ellipse cx="32" cy="47.5" rx="2.1" ry="1.2" fill="#FCA5A5" />
        </>
      )}

      {isSad && (
        <path
          d="M27.4 47.8 Q32 45.3 36.6 47.8"
          stroke="#7C2D12"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
