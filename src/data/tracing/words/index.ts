import { type LetterStrokeAnimation } from "../types";
import { wordToneStrokeCaSac } from "./ca-sac";
import { wordStrokeCa } from "./ca";

export const WORD_STROKE_MAP: Record<string, LetterStrokeAnimation> = {
  "cá": wordStrokeCa,
  "tone-sac": wordToneStrokeCaSac,
};
