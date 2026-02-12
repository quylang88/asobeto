import { letterStrokeO } from "./o";
import { LetterStrokeAnimation, LetterStrokePath } from "../types";

const circumflexStroke: LetterStrokePath = {
  // Dấu mũ của "ô": đặt ngay phía trên đỉnh chữ "o", cân giữa theo trục ngang.
  start: { x: 86, y: 118 },
  curves: [
    {
      // Vế trái đi lên đỉnh mũ.
      control1: { x: 94, y: 116 },
      control2: { x: 104, y: 104 },
      end: { x: 116, y: 96 },
    },
    {
      // Vế phải hạ xuống.
      control1: { x: 129, y: 104 },
      control2: { x: 139, y: 116 },
      end: { x: 147, y: 118 },
    },
  ],
  durationMs: 1300,
};

export const letterStrokeOo: LetterStrokeAnimation = {
  letter: "ô",
  strokes: [
    ...letterStrokeO.strokes.map((stroke, index) => ({
      ...stroke,
      curves: stroke.curves.map((curve) => ({ ...curve })),
      pauseAfterMs:
        index === letterStrokeO.strokes.length - 1 ? 700 : stroke.pauseAfterMs,
    })),
    circumflexStroke,
  ],
};

