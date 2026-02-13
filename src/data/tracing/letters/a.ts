import { type LetterStrokeAnimation } from "../types";

export const letterStrokeA: LetterStrokeAnimation = {
  letter: "a",
  layout: {
    columns: 3,
    rows: 4,
  },
  glyph: {
    x: 42,
    y: 136,
    sizeScale: 2,
  },
  demo: {
    strategy: "auto",
    auto: {
      strokeCount: 1,
      strokeHints: [
        {
          start: { x: 78, y: 188 },
          end: { x: 170, y: 212 },
          pauseAnchors: [{ point: { x: 122, y: 130 }, pauseMs: 520 }],
        },
      ],
    },
  },
};
