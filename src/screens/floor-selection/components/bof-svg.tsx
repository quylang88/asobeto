import React from "react";

export function BofSvg() {
  return (
    <svg
      viewBox="0 0 56 56"
      className="relative z-10 h-full w-full p-1.5 drop-shadow-[0_2px_4px_rgba(124,45,18,0.28)]"
      aria-label="Bò"
      role="img"
    >
      {/* Horns */}
      <path d="M16 18 C14 13, 16 9, 20 10 C20 13, 19 16, 16 18 Z" fill="#FDE68A" />
      <path d="M40 18 C42 13, 40 9, 36 10 C36 13, 37 16, 40 18 Z" fill="#FDE68A" />

      {/* Head */}
      <ellipse cx="28" cy="30" rx="17" ry="14" fill="#FB923C" />

      {/* Patches */}
      <path d="M17 28 C19 23, 25 23, 24 29 C23 33, 18 33, 17 28 Z" fill="#FDE68A" opacity="0.9" />
      <path d="M31 24 C35 20, 41 23, 39 28 C37 31, 33 30, 31 24 Z" fill="#FED7AA" opacity="0.9" />

      {/* Symmetric light area behind eyes */}
      <ellipse cx="23" cy="28.6" rx="3.6" ry="2.6" fill="#FFEDD5" opacity="0.9" />
      <ellipse cx="33" cy="28.6" rx="3.6" ry="2.6" fill="#FFEDD5" opacity="0.9" />

      {/* Nose area */}
      <ellipse cx="28" cy="36" rx="8.5" ry="5.5" fill="#FDBA74" />
      <circle cx="25" cy="36" r="1.2" fill="#9A3412" />
      <circle cx="31" cy="36" r="1.2" fill="#9A3412" />

      {/* Eyes - symmetric closed arcs */}
      <path
        d="M20.5 29.2 Q23 27.4 25.5 29.2"
        stroke="#7C2D12"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M30.5 29.2 Q33 27.4 35.5 29.2"
        stroke="#7C2D12"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Smile */}
      <path
        d="M24 40 Q28 43 32 40"
        stroke="#7C2D12"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Ears */}
      <ellipse cx="14.5" cy="28" rx="3.3" ry="6" fill="#FB923C" transform="rotate(-20 14.5 28)" />
      <ellipse cx="41.5" cy="28" rx="3.3" ry="6" fill="#FB923C" transform="rotate(20 41.5 28)" />
    </svg>
  );
}
