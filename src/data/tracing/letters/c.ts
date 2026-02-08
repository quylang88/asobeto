import { LetterStrokeAnimation } from "./types";

// Nét chữ "c" thường chuẩn tiếng Việt: 1 nét cong liền mạch, mở bên phải
export const letterStrokeC: LetterStrokeAnimation = {
  letter: "c",
  strokes: [
    {
      // Nét 1: cong trái, đặt bút dưới đường kẻ 3 một chút
      start: { x: 182, y: 160 },
      curves: [
        {
          control1: { x: 172, y: 134 },
          control2: { x: 120, y: 134 },
          // Vòng lên chạm đường kẻ 3
          end: { x: 98, y: 170 },
        },
        {
          control1: { x: 78, y: 210 },
          control2: { x: 84, y: 274 },
          // Vòng xuống chạm đường kẻ 1 (đáy)
          end: { x: 134, y: 276 },
        },
        {
          control1: { x: 174, y: 278 },
          control2: { x: 188, y: 260 },
          // Kết thúc lưng chừng đường kẻ 1-2
          end: { x: 182, y: 230 },
        },
      ],
      // Nét đơn liền mạch chạy chậm để bé quan sát rõ hướng tô
      durationMs: 5800,
    },
  ],
};
