import { LetterStrokeAnimation } from "./types";

// Nét chữ "c" thường chuẩn tiếng Việt: 1 nét cong liền mạch, mở bên phải
export const letterStrokeC: LetterStrokeAnimation = {
  letter: "c",
  strokes: [
    {
      // Nét 1: cong trái, đặt bút dưới đường kẻ 3 một chút
      start: { x: 188, y: 148 },
      curves: [
        {
          control1: { x: 176, y: 134 },
          control2: { x: 128, y: 124 },
          end: { x: 96, y: 164 },
        },
        {
          control1: { x: 70, y: 196 },
          control2: { x: 72, y: 264 },
          end: { x: 126, y: 278 },
        },
        {
          control1: { x: 166, y: 286 },
          control2: { x: 202, y: 262 },
          // Dừng ở khoảng giữa đường kẻ 1 và đường kẻ 2
          end: { x: 186, y: 244 },
        },
      ],
      // Nét đơn liền mạch chạy chậm để bé quan sát rõ hướng tô
      durationMs: 5800,
    },
  ],
};
