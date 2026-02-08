import { LetterStrokeAnimation } from "./types";

// Nét chữ "a" thường chuẩn tiếng Việt: 1 nét cong kín + 1 nét móc ngược phải
export const letterStrokeA: LetterStrokeAnimation = {
  letter: "a",
  strokes: [
    {
      // Nét 1: vòng kín, canh biên trên/dưới vừa chạm đường nét đứt
      start: { x: 174, y: 168 },
      curves: [
        {
          control1: { x: 149, y: 153 },
          control2: { x: 113, y: 149 },
          // Cung trên bo mềm, không đội qua vạch top
          end: { x: 84, y: 158 },
        },
        {
          control1: { x: 56, y: 176 },
          control2: { x: 44, y: 202 },
          // Cung trái hạ xuống đáy
          end: { x: 58, y: 230 },
        },
        {
          control1: { x: 72, y: 258 },
          control2: { x: 102, y: 273 },
          // Cung đáy chạy về bên phải
          end: { x: 132, y: 272 },
        },
        {
          control1: { x: 154, y: 271 },
          control2: { x: 174, y: 227 },
          // Khép vòng kín mềm, trở lại điểm bắt đầu
          end: { x: 174, y: 168 },
        },
      ],
      durationMs: 4600,
      pauseAfterMs: 1000,
    },
    {
      // Nét 2: nét móc ngược phải, từ đỉnh xuống đáy rồi móc rộng sang phải
      start: { x: 182, y: 149 },
      curves: [
        {
          control1: { x: 182, y: 214 },
          control2: { x: 180, y: 268 },
          // Đi xuống đáy rồi chuyển hướng mượt, tránh gãy ở chân nét
          end: { x: 186, y: 270 },
        },
        {
          control1: { x: 196, y: 272 },
          control2: { x: 236, y: 244 },
          // Điểm kết thúc nâng cao gần top hàng 1, độ cong liền mạch hơn
          end: { x: 266, y: 208 },
        },
      ],
      durationMs: 2400,
    },
  ],
};
