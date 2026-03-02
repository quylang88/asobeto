import { type LetterStrokeAnimation } from "../types";

export const letterStrokeM: LetterStrokeAnimation = {
  letter: "m",
  layout: {
    columns: 5,
    rows: 4,
    cellSize: 56,
  },
  glyph: {
    x: 8.5,
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
