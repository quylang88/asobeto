import { wordStrokeAwn } from "./awn";
import { type LetterStrokeAnimation } from "../types";
import { wordStrokeCas, wordToneStrokeCaSac } from "./cas";
import { wordStrokeCor, wordToneStrokeCoHoi } from "./cor";

export const WORD_STROKE_MAP: Record<string, LetterStrokeAnimation> = {
  ăn: wordStrokeAwn,
  cá: wordStrokeCas,
  cỏ: wordStrokeCor,
  "tone-sac": wordToneStrokeCaSac,
  "tone-hoi": wordToneStrokeCoHoi,
};
