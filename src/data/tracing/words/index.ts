import { wordStrokeAwn } from "./awn";
import { type LetterStrokeAnimation } from "../types";
import { wordStrokeBof } from "./bof";
import { wordStrokeBos } from "./boos";
import { wordStrokeCas } from "./cas";
import { wordStrokeCor } from "./cor";
import { wordStrokeMej } from "./mej";

export const WORD_STROKE_MAP: Record<string, LetterStrokeAnimation> = {
  ăn: wordStrokeAwn,
  bò: wordStrokeBof,
  bố: wordStrokeBos,
  cá: wordStrokeCas,
  cỏ: wordStrokeCor,
  mẹ: wordStrokeMej,
};
