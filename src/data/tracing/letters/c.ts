import { LetterStrokeAnimation } from "./types";

// Nét chữ "c" thường chuẩn tiếng Việt: 1 nét cong liền mạch, mở bên phải
export const letterStrokeC: LetterStrokeAnimation = {
  letter: "c",
  strokes: [
    {
      // Nét 1: cong trái, điểm bắt đầu lùi lại, tránh chạm biên phải (x=186)
      start: { x: 172, y: 160 },
      curves: [
        {
          control1: { x: 160, y: 130 },
          control2: { x: 100, y: 130 },
          // Vòng sâu vào giữa cột 1 bên trái (x~46) tương tự 'a'
          end: { x: 46, y: 200 },
        },
        {
          control1: { x: 30, y: 250 },
          control2: { x: 70, y: 284 },
          // Chạm đáy tại cột 2
          end: { x: 134, y: 278 },
        },
        {
          control1: { x: 174, y: 280 },
          control2: { x: 194, y: 260 },
          // Móc lên tạo khe hở
          end: { x: 182, y: 230 },
        },
      ],
      // Nét đơn liền mạch chạy chậm để bé quan sát rõ hướng tô
      durationMs: 5800,
    },
  ],
};
