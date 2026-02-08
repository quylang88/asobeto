import { LetterStrokeAnimation } from "./types";

// Nét chữ "a" thường chuẩn tiếng Việt: 1 nét cong kín + 1 nét móc ngược phải
export const letterStrokeA: LetterStrokeAnimation = {
  letter: "a",
  strokes: [
    {
      // Nét 1: cong kín, bắt đầu dưới đường kẻ 3
      start: { x: 178, y: 154 },
      curves: [
        {
          control1: { x: 164, y: 132 },
          control2: { x: 118, y: 132 },
          // Vòng xuống bên trái
          end: { x: 98, y: 168 },
        },
        {
          control1: { x: 78, y: 210 },
          control2: { x: 84, y: 274 },
          // Chạm đường kẻ 1 (đáy)
          end: { x: 134, y: 276 },
        },
        {
          control1: { x: 168, y: 278 },
          control2: { x: 184, y: 250 },
          // Đóng kín nét cong
          end: { x: 176, y: 190 },
        },
      ],
      durationMs: 4600,
      pauseAfterMs: 1000,
    },
    {
      // Nét 2: nét móc ngược phải, từ đường kẻ 3 xuống đường kẻ 1 rồi móc lên
      start: { x: 184, y: 140 },
      curves: [
        {
          control1: { x: 184, y: 200 },
          control2: { x: 186, y: 240 },
          // Đi thẳng xuống gần đáy
          end: { x: 190, y: 260 },
        },
        {
          control1: { x: 194, y: 280 },
          control2: { x: 214, y: 276 },
          // Móc lên dừng ở đường kẻ 2 (khoảng giữa)
          end: { x: 224, y: 246 },
        },
      ],
      durationMs: 2400,
    },
  ],
};
