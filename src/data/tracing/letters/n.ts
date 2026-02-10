import { LetterStrokeAnimation } from "../types";

export const letterStrokeN: LetterStrokeAnimation = {
  letter: "n",
  // Chữ "n" mẫu dùng 4 ô ngang để bám bố cục ảnh tham chiếu.
  layout: {
    columns: 4,
    rows: 4,
  },
  strokes: [
    {
      // Nét 1: bắt đầu giữa ĐK2-ĐK3 ở mép trái ô 1, vòng lên chạm ĐK3 rồi hạ xuống đáy ĐK1 ở mép trái ô 2.
      start: { x: 8, y: 170 },
      curves: [
        {
          control1: { x: 13, y: 162 },
          control2: { x: 30, y: 142 },
          end: { x: 48, y: 143 },
        },
        {
          control1: { x: 70, y: 162 },
          control2: { x: 65, y: 244 },
          end: { x: 66, y: 270 },
        },
      ],
      durationMs: 2300,
      pauseAfterMs: 800,
    },
    {
      // Nét 2: bắt đầu tại giao điểm ĐK2 với mép trái ô 2, vòng lên giữa ô 3, xuống đáy ĐK1 rồi vòng lên kết ở giữa ô 4 tại ĐK2.
      start: { x: 70, y: 210 },
      curves: [
        {
          control1: { x: 94, y: 184 },
          control2: { x: 140, y: 156 },
          end: { x: 140, y: 142 },
        },
        {
          control1: { x: 204, y: 186 },
          control2: { x: 214, y: 244 },
          end: { x: 175, y: 270 },
        },
        {
          control1: { x: 220, y: 276 },
          control2: { x: 238, y: 236 },
          end: { x: 245, y: 210 },
        },
      ],
      durationMs: 3600,
    },
  ],
};
