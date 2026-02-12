import { LetterStrokeAnimation } from "../types";

// Nét chữ "b" viết thường kiểu nối nét:
// - Nét đầu đi chéo từ ô cột 1 sang ô cột 2.
// - Vòng lên chạm hàng cao nhất rồi lượn xuống men theo mép giữa cột 1 và cột 2.
// - Tiếp tục vòng dưới và thoát nét có xoắn nhỏ.
export const letterStrokeB: LetterStrokeAnimation = {
  letter: "b",
  layout: {
    columns: 3,
    rows: 5,
  },
  strokes: [
    {
      // Bắt đầu trên đường kẻ 2.
      start: { x: 55, y: 217 },
      curves: [
        {
          // Nét chéo sang cột 2 (điểm giao gần line 3).
          control1: { x: 72, y: 206 },
          control2: { x: 112, y: 180 },
          end: { x: 176, y: 60 },
        },
        {
          // Vòng lên đỉnh (chạm hàng cao nhất).
          control1: { x: 160, y: 124 },
          control2: { x: 160, y: 42 },
          end: { x: 150, y: 8 },
        },
        {
          // Quấn đầu khuyết sang phải.
          control1: { x: 102, y: -10 },
          control2: { x: 102, y: 8 },
          end: { x: 102, y: 52 },
        },
        {
          // Lượn xuống men theo mép giữa cột 1 và cột 2.
          control1: { x: 102, y: 110 },
          control2: { x: 102, y: 146 },
          end: { x: 102, y: 168 },
        },
        {
          // Xuống vòng dưới.
          control1: { x: 96, y: 188 },
          control2: { x: 94, y: 236 },
          end: { x: 118, y: 262 },
        },
        {
          // Đáy cong chạy sang phải.
          control1: { x: 150, y: 284 },
          control2: { x: 205, y: 276 },
          end: { x: 219, y: 236 },
        },
        {
          // Đi lên tạo vòng nhỏ bên phải.
          control1: { x: 236, y: 208 },
          control2: { x: 246, y: 180 },
          end: { x: 232, y: 164 },
        },
        {
          // Khép vòng nhỏ và thoát nét sang phải.
          control1: { x: 217, y: 150 },
          control2: { x: 192, y: 162 },
          end: { x: 202, y: 182 },
        },
        {
          control1: { x: 214, y: 202 },
          control2: { x: 246, y: 188 },
          end: { x: 274, y: 178 },
        },
      ],
      durationMs: 7600,
    },
  ],
};
