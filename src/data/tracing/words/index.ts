import { wordStrokeAwn } from "./awn";
import { type LetterStrokeAnimation } from "../types";
import { wordStrokeBof, wordToneStrokeBoHuyen } from "./bof";
import { wordStrokeBos } from "./boos";
import { wordStrokeCas, wordToneStrokeCaSac } from "./cas";
import { wordStrokeCor, wordToneStrokeCoHoi } from "./cor";

export const WORD_STROKE_MAP: Record<string, LetterStrokeAnimation> = {
  ăn: wordStrokeAwn,
  bò: wordStrokeBof,
  bố: wordStrokeBos,
  cá: wordStrokeCas,
  cỏ: wordStrokeCor,
  "tone-huyen": wordToneStrokeBoHuyen,
  "tone-sac": wordToneStrokeCaSac,
  "tone-hoi": wordToneStrokeCoHoi,
};
