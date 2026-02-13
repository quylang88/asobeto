import { letterStrokeA } from "./a";
import { letterStrokeĂ } from "./ă";
import { letterStrokeÂ } from "./â";
import { letterStrokeB } from "./b";
import { letterStrokeC } from "./c";
import { letterStrokeD } from "./d";
import { letterStrokeĐ } from "./đ";
import { letterStrokeE } from "./e";
import { letterStrokeÊ } from "./ê";
import { letterStrokeG } from "./g";
import { letterStrokeH } from "./h";
import { letterStrokeI } from "./i";
import { letterStrokeK } from "./k";
import { letterStrokeL } from "./l";
import { letterStrokeM } from "./m";
import { letterStrokeN } from "./n";
import { letterStrokeO } from "./o";
import { letterStrokeÔ } from "./ô";
import { letterStrokeƠ } from "./ơ";
import { letterStrokeP } from "./p";
import { letterStrokeQ } from "./q";
import { letterStrokeR } from "./r";
import { letterStrokeS } from "./s";
import { letterStrokeT } from "./t";
import { letterStrokeU } from "./u";
import { letterStrokeƯ } from "./ư";
import { letterStrokeV } from "./v";
import { letterStrokeX } from "./x";
import { letterStrokeY } from "./y";
import { type LetterStrokeAnimation } from "../types";

export const LETTER_STROKE_MAP: Record<string, LetterStrokeAnimation> = {
  a: letterStrokeA,
  "ă": letterStrokeĂ,
  "â": letterStrokeÂ,
  b: letterStrokeB,
  c: letterStrokeC,
  d: letterStrokeD,
  "đ": letterStrokeĐ,
  e: letterStrokeE,
  "ê": letterStrokeÊ,
  g: letterStrokeG,
  h: letterStrokeH,
  i: letterStrokeI,
  k: letterStrokeK,
  l: letterStrokeL,
  m: letterStrokeM,
  n: letterStrokeN,
  o: letterStrokeO,
  "ô": letterStrokeÔ,
  "ơ": letterStrokeƠ,
  p: letterStrokeP,
  q: letterStrokeQ,
  r: letterStrokeR,
  s: letterStrokeS,
  t: letterStrokeT,
  u: letterStrokeU,
  "ư": letterStrokeƯ,
  v: letterStrokeV,
  x: letterStrokeX,
  y: letterStrokeY,
};
