import { type LetterStrokeAnimation } from "../types";

export const letterStrokeN: LetterStrokeAnimation = {
  letter: "n",
  layout: {
    columns: 4,
    rows: 4,
  },
  glyph: {
    x: 8,
    y: 132,
    sizeScale: 1.5,
  },
  demo: {
    strategy: "auto",
    auto: {
      strokeCount: 1,
    },
  },
};
