/**
 * Custom SVG icon set for Mystery Wheel game.
 * All icons share: 24x24 viewBox, 2px stroke, round caps/joins, soft drop-shadow.
 * Palette: cohesive pastel tones matching the mystery theme.
 */
import type { SVGProps } from "react";

interface WheelIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

const defaults = (size: number): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

/* -- Mystery / question mark in a circle ---------------------------------- */
export function IconMystery({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <circle cx="12" cy="12" r="10" stroke="#c4b5fd" fill="#7c3aed" fillOpacity={0.25} />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.33c-.54.32-.9.88-.9 1.47V14" stroke="#c4b5fd" />
      <circle cx="12" cy="17" r="0.8" fill="#c4b5fd" stroke="none" />
    </svg>
  );
}

/* -- Game controller (easy) ----------------------------------------------- */
export function IconGameEasy({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <rect x="2" y="6" width="20" height="12" rx="4" stroke="#86efac" fill="#10b981" fillOpacity={0.2} />
      <circle cx="8" cy="12" r="1.5" fill="#86efac" stroke="none" />
      <circle cx="16" cy="10.5" r="1" fill="#86efac" stroke="none" />
      <circle cx="16" cy="13.5" r="1" fill="#86efac" stroke="none" />
    </svg>
  );
}

/* -- Game controller (medium) --------------------------------------------- */
export function IconGameMedium({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <rect x="2" y="6" width="20" height="12" rx="4" stroke="#fdba74" fill="#f97316" fillOpacity={0.2} />
      <line x1="7" y1="10" x2="7" y2="14" stroke="#fdba74" />
      <line x1="5" y1="12" x2="9" y2="12" stroke="#fdba74" />
      <circle cx="16" cy="10.5" r="1" fill="#fdba74" stroke="none" />
      <circle cx="16" cy="13.5" r="1" fill="#fdba74" stroke="none" />
    </svg>
  );
}

/* -- Game controller (hard) ----------------------------------------------- */
export function IconGameHard({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <rect x="2" y="6" width="20" height="12" rx="4" stroke="#fca5a5" fill="#ef4444" fillOpacity={0.2} />
      <path d="M6 10l2 2-2 2" stroke="#fca5a5" />
      <circle cx="15" cy="10.5" r="1" fill="#fca5a5" stroke="none" />
      <circle cx="17" cy="12" r="1" fill="#fca5a5" stroke="none" />
      <circle cx="15" cy="13.5" r="1" fill="#fca5a5" stroke="none" />
    </svg>
  );
}

/* -- Heart +1 ------------------------------------------------------------- */
export function IconHeartPlus({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path
        d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z"
        stroke="#fda4af" fill="#f43f5e" fillOpacity={0.25}
      />
      <line x1="17" y1="5" x2="17" y2="9" stroke="#fda4af" />
      <line x1="15" y1="7" x2="19" y2="7" stroke="#fda4af" />
    </svg>
  );
}

/* -- Star +1 -------------------------------------------------------------- */
export function IconStarPlus1({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path
        d="M12 2l2.7 5.5L21 8.5l-4.5 4.4 1.1 6.1L12 16l-5.6 3 1.1-6.1L3 8.5l6.3-1L12 2z"
        stroke="#fde047" fill="#eab308" fillOpacity={0.25}
      />
    </svg>
  );
}

/* -- Star +2 -------------------------------------------------------------- */
export function IconStarPlus2({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path
        d="M10 3l2.2 4.5L17 8l-3.5 3.4.8 5L10 14l-4.3 2.4.8-5L3 8l4.8-.5L10 3z"
        stroke="#fde047" fill="#f59e0b" fillOpacity={0.25}
      />
      <text x="18" y="20" fontSize="9" fontWeight="bold" fill="#fde047" fontFamily="sans-serif">{"x2"}</text>
    </svg>
  );
}

/* -- Star +3 -------------------------------------------------------------- */
export function IconStarPlus3({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path
        d="M10 3l2.2 4.5L17 8l-3.5 3.4.8 5L10 14l-4.3 2.4.8-5L3 8l4.8-.5L10 3z"
        stroke="#fde047" fill="#fbbf24" fillOpacity={0.3}
      />
      <text x="18" y="20" fontSize="9" fontWeight="bold" fill="#fde047" fontFamily="sans-serif">{"x3"}</text>
    </svg>
  );
}

/* -- Star minus (comet / falling star) ------------------------------------ */
export function IconStarMinus({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path
        d="M12 2l2 4 4.5.7-3.3 3.2.8 4.5L12 12l-4 2.4.8-4.5L5.5 6.7 10 6l2-4z"
        stroke="#a5b4fc" fill="#6366f1" fillOpacity={0.2}
      />
      <line x1="15" y1="17" x2="19" y2="17" stroke="#a5b4fc" />
    </svg>
  );
}

/* -- Tracing alphabet (pen on A) ------------------------------------------ */
export function IconTracingAlpha({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="#7dd3fc" fill="#0ea5e9" fillOpacity={0.15} />
      <text x="12" y="16.5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#7dd3fc" fontFamily="sans-serif">{"A"}</text>
      <path d="M16 5l2.5-2.5M18.5 2.5l-1 3.5-2.5 1" stroke="#7dd3fc" />
    </svg>
  );
}

/* -- Tracing vocabulary (pen on book) ------------------------------------- */
export function IconTracingVocab({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M4 19V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14l-7-3-7 3z" stroke="#5eead4" fill="#14b8a6" fillOpacity={0.2} />
      <line x1="8" y1="8" x2="14" y2="8" stroke="#5eead4" />
      <line x1="8" y1="12" x2="12" y2="12" stroke="#5eead4" />
    </svg>
  );
}

/* -- Star x2 multiplier --------------------------------------------------- */
export function IconStarX2({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <circle cx="12" cy="12" r="10" stroke="#67e8f9" fill="#06b6d4" fillOpacity={0.2} />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#67e8f9" fontFamily="sans-serif">{"x2"}</text>
    </svg>
  );
}

/* -- Broken heart (heart loss effect) ------------------------------------- */
export function IconBrokenHeart({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path
        d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z"
        stroke="#fca5a5" fill="#ef4444" fillOpacity={0.35}
      />
      <path d="M12 7l-1 4 2 1-1 4" stroke="#fca5a5" strokeWidth={1.5} />
    </svg>
  );
}

/* -- Trophy icon for win screen ------------------------------------------- */
export function IconTrophy({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path d="M6 3h12v4a6 6 0 0 1-12 0V3z" stroke="#fde047" fill="#fbbf24" fillOpacity={0.3} />
      <path d="M6 5H3v2a3 3 0 0 0 3 3" stroke="#fde047" />
      <path d="M18 5h3v2a3 3 0 0 1-3 3" stroke="#fde047" />
      <line x1="12" y1="13" x2="12" y2="17" stroke="#fde047" />
      <rect x="8" y="17" width="8" height="3" rx="1" stroke="#fde047" fill="#fbbf24" fillOpacity={0.2} />
    </svg>
  );
}

/* -- Sad face for lose screen --------------------------------------------- */
export function IconSadFace({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <circle cx="12" cy="12" r="10" stroke="#c4b5fd" fill="#7c3aed" fillOpacity={0.15} />
      <circle cx="9" cy="10" r="1" fill="#c4b5fd" stroke="none" />
      <circle cx="15" cy="10" r="1" fill="#c4b5fd" stroke="none" />
      <path d="M8 16c1.5-2 5.5-2 7 0" stroke="#c4b5fd" strokeWidth={1.5} fill="none" transform="rotate(180 11.5 16)" />
    </svg>
  );
}

/* -- Crystal ball for center ---------------------------------------------- */
export function IconCrystalBall({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <circle cx="12" cy="10" r="8" stroke="#c4b5fd" fill="#8b5cf6" fillOpacity={0.2} />
      <path d="M8 7c1.5-1.5 5.5-1.5 7 0" stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} fill="none" />
      <ellipse cx="12" cy="20" rx="6" ry="2" stroke="#c4b5fd" fill="#7c3aed" fillOpacity={0.15} />
      <circle cx="10" cy="9" r="1" fill="rgba(255,255,255,0.35)" stroke="none" />
    </svg>
  );
}

/* -- Filled heart (for HUD display) --------------------------------------- */
export function IconHeart({ size = 24, filled = true, ...props }: WheelIconProps & { filled?: boolean }) {
  return (
    <svg {...defaults(size)} {...props}>
      <path
        d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10z"
        stroke={filled ? "#fb7185" : "#4a4458"}
        fill={filled ? "#f43f5e" : "none"}
        fillOpacity={filled ? 0.8 : 0}
        strokeOpacity={filled ? 1 : 0.4}
      />
    </svg>
  );
}

/* -- Star icon (for HUD / flying star) ------------------------------------ */
export function IconStarFly({ size = 24, ...props }: WheelIconProps) {
  return (
    <svg {...defaults(size)} {...props}>
      <path
        d="M12 2l2.7 5.5L21 8.5l-4.5 4.4 1.1 6.1L12 16l-5.6 3 1.1-6.1L3 8.5l6.3-1L12 2z"
        stroke="#fde047" fill="#fbbf24" fillOpacity={0.85}
      />
    </svg>
  );
}

/**
 * Map from WheelSegmentKind to icon rendering function for use in SVG <foreignObject>.
 */
export const WHEEL_ICON_MAP: Record<string, (props: WheelIconProps) => JSX.Element> = {
  MYSTERY: IconMystery,
  GAME_EASY: IconGameEasy,
  GAME_MEDIUM: IconGameMedium,
  GAME_HARD: IconGameHard,
  HEART_PLUS_1: IconHeartPlus,
  STAR_PLUS_1: IconStarPlus1,
  STAR_PLUS_2: IconStarPlus2,
  STAR_PLUS_3: IconStarPlus3,
  STAR_MINUS_1: IconStarMinus,
  TRACING_ALPHA: IconTracingAlpha,
  TRACING_VOCAB: IconTracingVocab,
  STAR_X2_NEXT: IconStarX2,
};
