import { type LetterStrokeAnimation } from "../types";

export const letterStrokeB: LetterStrokeAnimation = {
  letter: "b",
  layout: {
    columns: 3,
    rows: 5,
  },
  glyph: {
    x: 46,
    y: -6,
    sizeScale: 1.98,
  },
  demo: {
    strategy: "auto",
    auto: {
      strokeCount: 2,
      strokeHints: [
        {
          start: { x: 84, y: -6 },
          end: { x: 86, y: 260 },
        },
        {
          start: { x: 100, y: 132 },
          end: { x: 172, y: 220 },
        },
      ],
    },
  },
};
