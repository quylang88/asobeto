import { LetterStrokeAnimation } from "./types";

// Nét chữ "a" thường chuẩn tiếng Việt: 1 nét cong kín + 1 nét móc ngược phải
export const letterStrokeA: LetterStrokeAnimation = {
  letter: "a",
  strokes: [
    {
      // Nét 1: cong kín, hạ thấp điểm bắt đầu (xấp xỉ giữa dòng 2)
      start: { x: 176, y: 167 },
      curves: [
        {
          control1: { x: 152, y: 136 },
          control2: { x: 114, y: 137 },
          // Cung trên của vòng kín
          end: { x: 84, y: 155 },
        },
        {
          control1: { x: 56, y: 172 },
          control2: { x: 44, y: 198 },
          // Cung trái hạ xuống đáy
          end: { x: 58, y: 230 },
        },
        {
          control1: { x: 70, y: 258 },
          control2: { x: 102, y: 274 },
          // Cung đáy chạy về bên phải
          end: { x: 134, y: 272 },
        },
        {
          control1: { x: 158, y: 270 },
          control2: { x: 185, y: 226 },
          // Khép vòng kín mềm, trở lại điểm bắt đầu
          end: { x: 176, y: 167 },
        },
      ],
      durationMs: 4600,
      pauseAfterMs: 1000,
    },
    {
      // Nét 2: nét móc ngược phải, từ đỉnh xuống đáy rồi móc rộng sang phải
      start: { x: 184, y: 143 },
      curves: [
        {
          control1: { x: 184, y: 210 },
          control2: { x: 180, y: 268 },
          // Đi thẳng xuống đáy
          end: { x: 210, y: 268 },
        },
        {
          control1: { x: 235, y: 268 },
          control2: { x: 255, y: 244 },
          // Móc rộng sang phải, chạm biên phải cột 3 (x~270)
          end: { x: 268, y: 212 },
        },
      ],
      durationMs: 2400,
    },
  ],
};
