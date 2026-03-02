import { letterStrokeA } from "./a";
import { letterStrokeAw } from "./aw";
import { letterStrokeB } from "./b";
import { letterStrokeC } from "./c";
import { letterStrokeE } from "./e";
import { letterStrokeM } from "./m";
import { letterStrokeN } from "./n";
import { letterStrokeO } from "./o";
import { letterStrokeOo } from "./oo";
import { type LetterStrokeAnimation } from "../types";

export const LETTER_STROKE_MAP: Record<string, LetterStrokeAnimation> = {
  a: letterStrokeA,
  "ă": letterStrokeAw,
  b: letterStrokeB,
  c: letterStrokeC,
  e: letterStrokeE,
  m: letterStrokeM,
  n: letterStrokeN,
  o: letterStrokeO,
  "ô": letterStrokeOo,
};
