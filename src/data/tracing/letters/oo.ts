import { type LetterStrokeAnimation } from "../types";

export const letterStrokeOo: LetterStrokeAnimation = {
  letter: "ô",
  layout: {
    columns: 3,
    rows: 4,
  },
  glyph: {
    x: 40,
    y: 83.5,
    sizeScale: 2,
  },
  demo: {
    strategy: "auto",
    auto: {
      strokeCount: 2,
      strokeHints: [
        {
          start: { x: 170, y: 148 },
          end: { x: 170, y: 214 },
        },
        {
          start: { x: 98, y: 78 },
          end: { x: 142, y: 50 },
          pauseBeforeMs: 800,
        },
      ],
    },
  },
};
