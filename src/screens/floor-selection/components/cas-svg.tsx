import React from "react";

export function CasSvg() {
  return (
    <svg
      viewBox="0 0 56 56"
      className="relative z-10 h-full w-full p-1.5 drop-shadow-[0_2px_4px_rgba(124,45,18,0.28)]"
      aria-label="Cá"
      role="img"
    >
      <ellipse cx="28" cy="29" rx="15" ry="11.5" fill="#F97316" />
      <path d="M13 29 L4 22 L4 36 Z" fill="#FB923C" />
      <ellipse
        cx="34"
        cy="24.5"
        rx="5.2"
        ry="4.2"
        fill="#FCD34D"
        opacity="0.88"
      />
      <circle cx="35.2" cy="28.4" r="1.75" fill="#7C2D12" />
      <circle cx="35.8" cy="27.9" r="0.7" fill="#fff" opacity="0.9" />
      <path
        d="M21 20 C25 15, 32 15, 35 20"
        stroke="#FB923C"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
