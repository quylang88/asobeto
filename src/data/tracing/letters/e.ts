import { LetterStrokeAnimation } from "../types";

// Chữ "e" dùng glyph của font hp-special để bám đúng kiểu chữ hiển thị trong app.
// Giữ layout lưới 3x4 như hiện tại, canh chữ bằng x/y và scale.
export const letterStrokeE: LetterStrokeAnimation = {
  letter: "e",
  layout: {
    columns: 3,
    rows: 4,
  },
  glyph: {
    text: "e",
    fontWeight: 400,
    sizeScale: 2.0,
    // Chỉ dùng x/y để dịch chuyển trái-phải, lên-xuống; sizeScale để phóng/thu chữ.
    x: 30,
    y: 136,
  },
  // Nét demo đi theo chiều viết: bắt đầu bên trái, vòng cung lên trên, kết thúc kéo về nét phải.
  strokes: [
    {
      start: { x: 17, y: 167 },
      curves: [
        {
          control1: { x: 8, y: 147 },
          control2: { x: 15, y: 107 },
          end: { x: 49, y: 87 },
        },
        {
          control1: { x: 79, y: 70 },
          control2: { x: 125, y: 73 },
          end: { x: 151, y: 96 },
        },
        {
          control1: { x: 174, y: 119 },
          control2: { x: 155, y: 150 },
          end: { x: 118, y: 153 },
        },
        {
          control1: { x: 89, y: 156 },
          control2: { x: 52, y: 156 },
          end: { x: 43, y: 176 },
        },
        {
          control1: { x: 36, y: 202 },
          control2: { x: 79, y: 210 },
          end: { x: 121, y: 202 },
        },
        {
          control1: { x: 151, y: 193 },
          control2: { x: 174, y: 179 },
          end: { x: 187, y: 156 },
        },
      ],
      durationMs: 5200,
    },
  ],
};
