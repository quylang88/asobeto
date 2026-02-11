import React from "react";

export function AwnSvg() {
  return (
    <svg
      viewBox="0 0 56 56"
      className="relative z-10 h-full w-full p-1.5 drop-shadow-[0_2px_4px_rgba(124,45,18,0.28)]"
      aria-label="Mèo"
      role="img"
    >
      {/* Ears */}
      <path d="M12 14 L18 24 L24 16 Z" fill="#F97316" transform="rotate(-15 18 19)" />
      <path d="M44 14 L38 24 L32 16 Z" fill="#F97316" transform="rotate(15 38 19)" />

      {/* Head */}
      <ellipse cx="28" cy="30" rx="16" ry="14" fill="#FB923C" />

      {/* Inner Ears Details */}
      <path d="M14 16 L18 22 L22 17 Z" fill="#FCD34D" opacity="0.7" transform="rotate(-15 18 19)" />
      <path d="M42 16 L38 22 L34 17 Z" fill="#FCD34D" opacity="0.7" transform="rotate(15 38 19)" />

      {/* Eyes - Happy/Closed */}
      <path d="M20 28 Q23 26 26 28" stroke="#7C2D12" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M30 28 Q33 26 36 28" stroke="#7C2D12" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Nose */}
      <circle cx="28" cy="33" r="1.5" fill="#EF4444" opacity="0.8" />

      {/* Mouth - Eating/Chewing - A small open mouth */}
      <path d="M26 36 Q28 39 30 36" fill="#7C2D12" />
      <path d="M27 36 Q28 37 29 36" fill="#FCA5A5" />

      {/* Whiskers */}
      <path d="M14 32 L8 31" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 35 L9 36" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 32 L48 31" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 35 L47 36" stroke="#FDBA74" strokeWidth="1.5" strokeLinecap="round" />

      {/* Paws holding food (implied) - simple circles at bottom */}
      <circle cx="20" cy="42" r="4" fill="#F97316" />
      <circle cx="36" cy="42" r="4" fill="#F97316" />
    </svg>
  );
}
