import React from "react";

export function BoosSvg() {
  return (
    <svg
      viewBox="0 0 56 56"
      className="relative z-10 h-full w-full p-1.5 drop-shadow-[0_2px_4px_rgba(124,45,18,0.28)]"
      aria-label="Bố"
      role="img"
    >
      {/* Hair */}
      <path
        d="M14 24 C14 15, 20 10, 28 10 C36 10, 42 15, 42 24 C39 20, 33 18, 28 18 C23 18, 17 20, 14 24 Z"
        fill="#7C2D12"
      />

      {/* Face */}
      <ellipse cx="28" cy="30" rx="15" ry="13" fill="#FDBA74" />

      {/* Ear */}
      <ellipse cx="13.6" cy="30" rx="2.8" ry="4.2" fill="#FDBA74" />
      <ellipse cx="42.4" cy="30" rx="2.8" ry="4.2" fill="#FDBA74" />

      {/* Eyebrows */}
      <path
        d="M20 26 Q22.4 24.5 25 26"
        stroke="#7C2D12"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M31 26 Q33.6 24.5 36 26"
        stroke="#7C2D12"
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
      />

      {/* Eyes */}
      <circle cx="22.8" cy="29.4" r="1.1" fill="#111827" />
      <circle cx="33.2" cy="29.4" r="1.1" fill="#111827" />

      {/* Nose */}
      <path
        d="M28 29.6 Q27.2 32 28.2 33.4"
        stroke="#C2410C"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Mustache */}
      <path
        d="M21 35 C23 32.5, 26 33, 28 35 C30 33, 33 32.5, 35 35 C32.8 36.8, 30.6 37.6, 28 37.6 C25.4 37.6, 23.2 36.8, 21 35 Z"
        fill="#7C2D12"
      />

      {/* Smile */}
      <path
        d="M24.5 39 Q28 41.5 31.5 39"
        stroke="#7C2D12"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />

      {/* Shirt */}
      <path d="M16 45 C19 41, 24 39, 28 39 C32 39, 37 41, 40 45 Z" fill="#FB923C" />
      <path
        d="M23.5 41.2 L28 46 L32.5 41.2"
        stroke="#FCD34D"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
