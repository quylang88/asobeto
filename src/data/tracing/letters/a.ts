import { LetterStrokeAnimation } from "./types";

// Nét chữ "a" thường chuẩn tiếng Việt: 1 nét cong kín + 1 nét móc ngược phải
export const letterStrokeA: LetterStrokeAnimation = {
  letter: "a",
  strokes: [
    {
      // Nét 1: thân chữ "a" kiểu bầu dục mềm tay, đáy nở hơn phần trên như vở tập viết tiểu học
      start: { x: 188, y: 118 },
      curves: [
        {
          control1: { x: 174, y: 96 },
          control2: { x: 146, y: 90 },
          end: { x: 122, y: 112 },
        },
        {
          control1: { x: 90, y: 142 },
          control2: { x: 88, y: 216 },
          end: { x: 126, y: 236 },
        },
        {
          control1: { x: 158, y: 252 },
          control2: { x: 198, y: 248 },
          end: { x: 220, y: 224 },
        },
        {
          control1: { x: 238, y: 202 },
          control2: { x: 230, y: 144 },
          end: { x: 188, y: 118 },
        },
      ],
      // Nét cong kín chạy chậm để bé quan sát rõ hướng đi của bút
      durationMs: 5000,
      // Dừng nhẹ 1s sau nét 1 trước khi bắt đầu nét 2
      pauseAfterMs: 1000,
    },
    {
      // Nét 2: móc ngược phải bám sát thân chữ, lên đỉnh dòng rồi kéo xuống và móc nhẹ sang phải
      start: { x: 188, y: 118 },
      curves: [
        {
          control1: { x: 190, y: 106 },
          control2: { x: 192, y: 94 },
          end: { x: 194, y: 84 },
        },
        {
          control1: { x: 194, y: 130 },
          control2: { x: 194, y: 190 },
          end: { x: 196, y: 220 },
        },
        {
          control1: { x: 200, y: 236 },
          control2: { x: 232, y: 214 },
          end: { x: 228, y: 172 },
        },
      ],
      // Nét móc ngược phải tiếp tục chạy chậm để bé dễ bắt chước theo
      durationMs: 3900,
    },
  ],
};
