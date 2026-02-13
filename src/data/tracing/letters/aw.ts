import { type LetterStrokeAnimation } from "../types";

export const letterStrokeAw: LetterStrokeAnimation = {
  letter: "ă",
  layout: {
    columns: 3,
    rows: 4,
  },
  glyph: {
    x: 42,
    y: 92,
    sizeScale: 2,
  },
  demo: {
    strategy: "auto",
    auto: {
      strokeCount: 2,
      strokeHints: [
        {
          start: { x: 78, y: 186 },
          end: { x: 170, y: 210 },
        },
        {
          start: { x: 96, y: 74 },
          end: { x: 148, y: 62 },
          pauseBeforeMs: 800,
        },
      ],
    },
  },
};
