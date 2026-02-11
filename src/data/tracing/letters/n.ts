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
      start: { x: 4, y: 170 },
      curves: [
        {
          control1: { x: 10, y: 165 },
          control2: { x: 30, y: 145 },
          end: { x: 45, y: 143 },
        },
        {
          control1: { x: 70, y: 140 },
          control2: { x: 75, y: 175 },
          end: { x: 70, y: 270 },
        },
      ],
      durationMs: 2300,
      pauseAfterMs: 800,
    },
    {
      // Nét 2: Móc hai đầu. Bắt đầu từ chân nét 1 (x=70, y=210), vòng lên ô 2, xuống ô 3 và móc lên.
      start: { x: 73, y: 205 },
      curves: [
        {
          control1: { x: 95, y: 170 },
          control2: { x: 125, y: 150 },
          end: { x: 145, y: 143 },
        },
        {
          control1: { x: 170, y: 140 },
          control2: { x: 175, y: 160 },
          end: { x: 175, y: 255 },
        },
        {
          control1: { x: 180, y: 300 },
          control2: { x: 225, y: 260 },
          end: { x: 240, y: 210 },
        },
      ],
      durationMs: 3600,
    },
  ],
};
