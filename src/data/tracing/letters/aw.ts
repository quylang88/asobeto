import { letterStrokeA } from "./a";
import { LetterStrokeAnimation, LetterStrokePath } from "../types";

const breveStroke: LetterStrokePath = {
  // Dấu ngoắc của "ă": hướng đúng (võng xuống), nhỏ hơn và dời trái nhẹ.
  start: { x: 100, y: 98 },
  curves: [
    {
      control1: { x: 116, y: 118 },
      control2: { x: 142, y: 118 },
      end: { x: 160, y: 98 },
    },
  ],
  durationMs: 1150,
};

export const letterStrokeAw: LetterStrokeAnimation = {
  letter: "ă",
  // Giữ nét 1/2 của "a" nhưng chỉ thêm pause 1000ms sau nét 2 cho riêng "ă".
  strokes: [
    ...letterStrokeA.strokes.map((stroke, index) => ({
      ...stroke,
      curves: stroke.curves.map((curve) => ({ ...curve })),
      pauseAfterMs: index === 1 ? 800 : stroke.pauseAfterMs,
    })),
    breveStroke,
  ],
};
