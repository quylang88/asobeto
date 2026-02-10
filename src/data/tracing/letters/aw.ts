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
  // Giữ nguyên 2 nét của "a", chỉ cộng thêm dấu ngoắc ở trên.
  strokes: [...letterStrokeA.strokes, breveStroke],
};
