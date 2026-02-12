import { LetterStrokeAnimation } from "../types";

// Nét chữ "o" thường: 1 nét cong kín, bầu dọc.
// Biên ngang được canh trong khoảng:
// - trái: nửa ô cột 1 (x ~ 47)
// - phải: hết ô cột 2 (x ~ 186)
export const letterStrokeO: LetterStrokeAnimation = {
  letter: "o",
  strokes: [
    {
      // Dựng ellipse 4 cung Bézier để bảo toàn đối xứng trái-phải và trên-dưới.
      // Tâm: (116.5, 205) | biên ngang: 47..186 | biên dọc: 141..269
      start: { x: 116.5, y: 141 },
      curves: [
        {
          // Cung trên -> trái
          control1: { x: 78.1, y: 141 },
          control2: { x: 47, y: 169.6 },
          end: { x: 47, y: 205 },
        },
        {
          // Cung trái -> đáy
          control1: { x: 47, y: 240.4 },
          control2: { x: 78.1, y: 269 },
          end: { x: 116.5, y: 269 },
        },
        {
          // Cung đáy -> phải
          control1: { x: 154.9, y: 269 },
          control2: { x: 186, y: 240.4 },
          end: { x: 186, y: 205 },
        },
        {
          // Cung phải -> trên (khép nét)
          control1: { x: 186, y: 169.6 },
          control2: { x: 154.9, y: 141 },
          end: { x: 116.5, y: 141 },
        },
      ],
      durationMs: 5600,
    },
  ],
};
