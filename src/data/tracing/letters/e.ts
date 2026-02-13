import { type LetterStrokeAnimation } from "../types";

export const letterStrokeE: LetterStrokeAnimation = {
  letter: "e",
  layout: {
    columns: 3,
    rows: 4,
  },
  glyph: {
    x: 30,
    y: 136,
    sizeScale: 2,
  },
  demo: {
    strategy: "auto",
    auto: {
      strokeCount: 1,
    },
  },
};
