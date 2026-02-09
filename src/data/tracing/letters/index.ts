import { letterStrokeA } from "./a";
import { letterStrokeC } from "./c";
import { type LetterStrokeAnimation } from "../types";

export const LETTER_STROKE_MAP: Record<string, LetterStrokeAnimation> = {
  a: letterStrokeA,
  c: letterStrokeC,
};
