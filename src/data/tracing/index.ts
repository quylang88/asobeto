import { LETTER_STROKE_MAP } from "./letters";
import { WORD_STROKE_MAP } from "./words";
import { type LetterStrokeAnimation } from "./types";

const TRACING_STROKE_MAP: Record<string, LetterStrokeAnimation> = {
  ...LETTER_STROKE_MAP,
  ...WORD_STROKE_MAP,
};

export function getTracingStrokeAnimation(
  key: string,
): LetterStrokeAnimation | undefined {
  return TRACING_STROKE_MAP[key.trim().toLocaleLowerCase()];
}

// Backward-compatible alias for existing callers.
export const getLetterStrokeAnimation = getTracingStrokeAnimation;

export type {
  LetterStrokeAnimation,
  TracingAutoDemoConfig,
  TracingAutoStrokeHint,
  TracingDemoAnimationConfig,
  TracingGlyphConfig,
  TracingPauseAnchor,
  TracingGridLayout,
  TracingPausePoint,
  TracingStrokePath,
  TracingStrokePoint,
} from "./types";
