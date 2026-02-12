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
      start: { x: 48, y: 217 },
      curves: [
        {
          // Nét chéo sang cột 2 (điểm giao gần line 3).
          control1: { x: 72, y: 190 },
          control2: { x: 112, y: 180 },
          end: { x: 176, y: 60 },
        },
        {
          // Vòng lên đỉnh (chạm hàng cao nhất).
          control1: { x: 188, y: 38 },
          control2: { x: 178, y: 6 },
          end: { x: 150, y: 6 },
        },
        {
          // Quấn đầu khuyết sang phải.
          control1: { x: 126, y: 6 },
          control2: { x: 104, y: 24 },
          end: { x: 102, y: 52 },
        },
        {
          // Lượn xuống men theo mép giữa cột 1 và cột 2.
          control1: { x: 93, y: 92 },
          control2: { x: 93, y: 144 },
          end: { x: 93, y: 168 },
        },
        {
          // Men tiếp theo đường kẻ dọc rồi mới tách ra xuống vòng dưới.
          control1: { x: 93, y: 204 },
          control2: { x: 94, y: 224 },
          end: { x: 100, y: 232 },
        },
        {
          // Đáy cong tròn đều sang phải (chỉ chạm vượt line cuối nhẹ).
          control1: { x: 100, y: 242 },
          control2: { x: 166, y: 315 },
          end: { x: 231, y: 236 },
        },
        {
          // Dựng thân phải lên gần như thẳng rồi vào vòng nhỏ.
          control1: { x: 244, y: 214 },
          control2: { x: 238, y: 198 },
          end: { x: 234, y: 186 },
        },
        {
          // Cung trên của oval nhỏ.
          control1: { x: 232, y: 170 },
          control2: { x: 208, y: 160 },
          end: { x: 194, y: 182 },
        },
        {
          // Cung dưới khép oval tại thân phải.
          control1: { x: 182, y: 202 },
          control2: { x: 234, y: 192 },
          end: { x: 246, y: 190 },
        },
        {
          // Thoát nét liền mạch theo cung lên rồi vươn phải.
          control1: { x: 258, y: 188 },
          control2: { x: 272, y: 186 },
          end: { x: 266, y: 186 },
        },
      ],
      durationMs: 7600,
    },
  ],
};
