import { LetterStrokeAnimation } from "./types";

// Nét chữ "a" thường chuẩn tiếng Việt: 1 nét cong kín + 1 nét móc ngược phải
export const letterStrokeA: LetterStrokeAnimation = {
  letter: "a",
  strokes: [
    {
      // Nét 1: cong kín, đặt bút dưới đường kẻ 3 một chút rồi rê từ phải sang trái
      start: { x: 188, y: 148 },
      curves: [
        {
          control1: { x: 176, y: 134 },
          control2: { x: 126, y: 126 },
          end: { x: 96, y: 166 },
        },
        {
          control1: { x: 68, y: 202 },
          control2: { x: 74, y: 270 },
          end: { x: 126, y: 278 },
        },
        {
          control1: { x: 166, y: 286 },
          control2: { x: 214, y: 258 },
          end: { x: 214, y: 214 },
        },
        {
          control1: { x: 214, y: 182 },
          control2: { x: 196, y: 160 },
          // Dừng bút ở hông phải, gần đường kẻ 2 để nối logic sang nét 2
          end: { x: 170, y: 194 },
        },
      ],
      // Nét cong kín chạy chậm để bé quan sát rõ hướng đi của bút
      durationMs: 4600,
      // Dừng nhẹ 1s sau nét 1 trước khi bắt đầu nét 2
      pauseAfterMs: 1000,
    },
    {
      // Nét 2: lia lên đường kẻ 3, viết móc ngược phải sát nét cong kín và dừng ở đường kẻ 2
      start: { x: 188, y: 142 },
      curves: [
        {
          control1: { x: 190, y: 156 },
          control2: { x: 192, y: 186 },
          end: { x: 194, y: 210 },
        },
        {
          control1: { x: 198, y: 218 },
          control2: { x: 208, y: 214 },
          end: { x: 214, y: 208 },
        },
      ],
      // Nét móc ngược phải tiếp tục chạy chậm để bé dễ bắt chước theo
      durationMs: 2400,
    },
  ],
};
