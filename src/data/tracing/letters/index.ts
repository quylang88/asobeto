import { letterStrokeA } from "./a";
import { letterStrokeC } from "./c";
import { LetterStrokeAnimation, LetterStrokePath, StrokePoint } from "./types";

const LETTER_STROKE_MAP: Record<string, LetterStrokeAnimation> = {
  a: letterStrokeA,
  c: letterStrokeC,
};

export function getLetterStrokeAnimation(
  letter: string,
): LetterStrokeAnimation | undefined {
  return LETTER_STROKE_MAP[letter.trim().toLocaleLowerCase()];
}

export type { LetterStrokeAnimation, LetterStrokePath, StrokePoint };
