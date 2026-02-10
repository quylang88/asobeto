import { LetterStrokeAnimation } from "../types";

export const letterStrokeN: LetterStrokeAnimation = {
  letter: "n",
  // Chữ "n" mẫu dùng 3 ô ngang để bám bố cục ảnh tham chiếu.
  layout: {
    columns: 4,
    rows: 4,
  },
  strokes: [
    {
      // Nét 1: Móc trên trái. Bắt đầu từ dòng kẻ ngang 2 (y=210) trong ô 1.
      start: { x: 20, y: 210 },
      curves: [
        {
          control1: { x: 30, y: 170 },
          control2: { x: 45, y: 140 },
          end: { x: 55, y: 140 },
        },
        {
          control1: { x: 65, y: 140 },
          control2: { x: 70, y: 180 },
          end: { x: 70, y: 280 },
        },
      ],
      durationMs: 2300,
      pauseAfterMs: 800,
    },
    {
      // Nét 2: Móc hai đầu. Bắt đầu từ chân nét 1 (x=70, y=210), vòng lên ô 2, xuống ô 3 và móc lên.
      start: { x: 70, y: 210 },
      curves: [
        {
          control1: { x: 80, y: 160 },
          control2: { x: 90, y: 140 },
          end: { x: 105, y: 140 },
        },
        {
          control1: { x: 120, y: 140 },
          control2: { x: 140, y: 160 },
          end: { x: 140, y: 220 },
        },
        {
          control1: { x: 140, y: 260 },
          control2: { x: 155, y: 280 },
          end: { x: 175, y: 210 },
        },
      ],
      durationMs: 3600,
    },
  ],
};
