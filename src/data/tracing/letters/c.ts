import { type LetterStrokeAnimation } from "../types";

export const letterStrokeC: LetterStrokeAnimation = {
  letter: "c",
  layout: {
    columns: 3,
    rows: 4,
  },
  glyph: {
    x: 34,
    y: 134,
    sizeScale: 2,
  },
  demo: {
    strategy: "auto",
    auto: {
      strokeCount: 1,
      strokeHints: [
        {
          start: { x: 176, y: 142 },
          end: { x: 178, y: 214 },
        },
      ],
    },
  },
};
