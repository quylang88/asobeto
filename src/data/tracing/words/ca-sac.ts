import { LetterStrokeAnimation } from "../types";

// Dấu sắc dùng riêng cho từ "cá": nét ngắn, hướng dựng lên trên rõ hơn.
export const wordToneStrokeCaSac: LetterStrokeAnimation = {
  letter: "tone-sac",
  strokes: [
    {
      start: { x: 140, y: 138 },
      curves: [
        {
          control1: { x: 148, y: 114 },
          control2: { x: 160, y: 92 },
          end: { x: 170, y: 66 },
        },
      ],
      durationMs: 1400,
    },
  ],
};
