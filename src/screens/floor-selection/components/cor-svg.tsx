import React from "react";

export function CorSvg() {
  return (
    <svg
      viewBox="0 0 56 56"
      className="relative z-10 h-full w-full p-1.5 drop-shadow-[0_2px_4px_rgba(20,83,45,0.28)]"
      aria-label="Cỏ"
      role="img"
    >
      {/* Ground */}
      <ellipse cx="28" cy="44" rx="18" ry="6" fill="#16A34A" opacity="0.55" />

      {/* Grass tuft - blades fan out softly from center */}
      <path
        d="M28 44 C25 35, 25 23, 28 10 C31 23, 31 35, 28 44 Z"
        fill="#4ADE80"
      />
      <path
        d="M26 44 C22 35, 21 26, 23 15 C27 24, 28 35, 26 44 Z"
        fill="#34D399"
      />
      <path
        d="M30 44 C34 35, 35 26, 33 15 C29 24, 28 35, 30 44 Z"
        fill="#22C55E"
      />
      <path
        d="M24 45 C18 37, 16 30, 17 21 C22 29, 24 37, 24 45 Z"
        fill="#22C55E"
      />
      <path
        d="M32 45 C38 37, 40 30, 39 21 C34 29, 32 37, 32 45 Z"
        fill="#16A34A"
      />
      <path
        d="M22 45 C14 40, 11 34, 11 28 C17 33, 21 39, 22 45 Z"
        fill="#16A34A"
      />
      <path
        d="M34 45 C42 40, 45 34, 45 28 C39 33, 35 39, 34 45 Z"
        fill="#15803D"
      />

      {/* Leaf accents */}
      <path
        d="M28 39 C27 31, 27 24, 28 17"
        stroke="#BBF7D0"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M24.5 40 C22 34, 21 28, 22.3 22"
        stroke="#86EFAC"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M31.5 40 C34 34, 35 28, 33.7 22"
        stroke="#A7F3D0"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
