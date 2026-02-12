import { letterStrokeA } from "./a";
import { letterStrokeAw } from "./aw";
import { letterStrokeB } from "./b";
import { letterStrokeC } from "./c";
import { letterStrokeN } from "./n";
import { letterStrokeO } from "./o";
import { type LetterStrokeAnimation } from "../types";

export const LETTER_STROKE_MAP: Record<string, LetterStrokeAnimation> = {
  a: letterStrokeA,
  "ă": letterStrokeAw,
  b: letterStrokeB,
  c: letterStrokeC,
  n: letterStrokeN,
  o: letterStrokeO,
};
