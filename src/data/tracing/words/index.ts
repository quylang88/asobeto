import { wordStrokeAwn } from "./awn";
import { type LetterStrokeAnimation } from "../types";
import { wordStrokeCas, wordToneStrokeCaSac } from "./cas";

export const WORD_STROKE_MAP: Record<string, LetterStrokeAnimation> = {
  ăn: wordStrokeAwn,
  cá: wordStrokeCas,
  "tone-sac": wordToneStrokeCaSac,
};
