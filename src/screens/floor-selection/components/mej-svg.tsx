import React from "react";

export function MejSvg() {
  return (
    <svg
      viewBox="0 0 56 56"
      className="relative z-10 h-full w-full p-1.5 drop-shadow-[0_2px_4px_rgba(124,45,18,0.28)]"
      aria-label="Mẹ"
      role="img"
    >
      {/* Hair */}
      <path
        d="M12 25 C12 14, 20 9, 28 9 C36 9, 44 14, 44 25 C41 21, 35 18.5, 28 18.5 C21 18.5, 15 21, 12 25 Z"
        fill="#7C2D12"
      />
      <path
        d="M14 25 C13.5 34, 16.5 40, 20 44 C16 42.5, 12 37, 12 30 C12 27.5, 12.5 26, 14 25 Z"
        fill="#A16207"
      />
      <path
        d="M42 25 C42.5 34, 39.5 40, 36 44 C40 42.5, 44 37, 44 30 C44 27.5, 43.5 26, 42 25 Z"
        fill="#A16207"
      />

      {/* Face */}
      <ellipse cx="28" cy="30" rx="14.5" ry="13" fill="#FDBA74" />

      {/* Ears */}
      <ellipse cx="13.8" cy="30" rx="2.6" ry="4" fill="#FDBA74" />
      <ellipse cx="42.2" cy="30" rx="2.6" ry="4" fill="#FDBA74" />

      {/* Eyes */}
      <path
        d="M20.5 28.6 Q22.8 26.9 25 28.6"
        stroke="#7C2D12"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M31 28.6 Q33.2 26.9 35.5 28.6"
        stroke="#7C2D12"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
      />

      {/* Nose */}
      <path
        d="M28 29.8 Q27.1 31.8 28 33"
        stroke="#C2410C"
        strokeWidth="1.15"
        fill="none"
        strokeLinecap="round"
      />

      {/* Blush */}
      <ellipse cx="20.5" cy="33.2" rx="2.1" ry="1.2" fill="#FB7185" opacity="0.35" />
      <ellipse cx="35.5" cy="33.2" rx="2.1" ry="1.2" fill="#FB7185" opacity="0.35" />

      {/* Smile */}
      <path
        d="M24 37.8 Q28 40.6 32 37.8"
        stroke="#7C2D12"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />

      {/* Shirt */}
      <path d="M16 45 C19 41, 24 39, 28 39 C32 39, 37 41, 40 45 Z" fill="#F472B6" />
      <path
        d="M23.7 40.9 L28 45.4 L32.3 40.9"
        stroke="#F9A8D4"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
