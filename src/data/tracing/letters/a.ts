import { LetterStrokeAnimation } from "./types";

// Nét chữ "a" thường chuẩn tiếng Việt: 1 nét cong kín + 1 nét móc ngược phải
export const letterStrokeA: LetterStrokeAnimation = {
  letter: "a",
  strokes: [
    {
      // Nét 1: cong kín, hạ thấp điểm bắt đầu (xấp xỉ giữa dòng 2)
      start: { x: 184, y: 165 },
      curves: [
        {
          control1: { x: 168, y: 140 },
          control2: { x: 100, y: 140 },
          // Vòng sâu vào giữa cột 1 bên trái (x~46)
          end: { x: 46, y: 200 },
        },
        {
          control1: { x: 30, y: 240 },
          control2: { x: 60, y: 280 },
          // Chạm đáy tại cột 2
          end: { x: 134, y: 278 },
        },
        {
          control1: { x: 174, y: 276 },
          control2: { x: 194, y: 230 },
          // Khép kín vòng tròn, gặp lại điểm bắt đầu
          end: { x: 182, y: 165 },
        },
      ],
      durationMs: 4600,
      pauseAfterMs: 1000,
    },
    {
      // Nét 2: nét móc ngược phải, từ đỉnh xuống đáy rồi móc rộng sang phải
      start: { x: 184, y: 140 },
      curves: [
        {
          control1: { x: 184, y: 220 },
          control2: { x: 186, y: 260 },
          // Đi thẳng xuống đáy
          end: { x: 190, y: 276 },
        },
        {
          control1: { x: 200, y: 284 },
          control2: { x: 250, y: 280 },
          // Móc rộng sang phải, chạm biên phải cột 3 (x~270)
          end: { x: 270, y: 240 },
        },
      ],
      durationMs: 2400,
    },
  ],
};
