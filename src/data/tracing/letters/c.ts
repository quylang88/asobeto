import { LetterStrokeAnimation } from "./types";

// Nét chữ "c" thường chuẩn tiếng Việt: 1 nét cong liền mạch, mở bên phải
export const letterStrokeC: LetterStrokeAnimation = {
  letter: "c",
  strokes: [
    {
      // Điểm đặt bút thấp hơn dòng trên một chút, cong lên mềm trước khi ôm vòng thân chữ
      start: { x: 210, y: 128 },
      curves: [
        {
          control1: { x: 202, y: 104 },
          control2: { x: 168, y: 90 },
          end: { x: 136, y: 112 },
        },
        {
          control1: { x: 92, y: 142 },
          control2: { x: 92, y: 220 },
          end: { x: 136, y: 240 },
        },
        {
          control1: { x: 174, y: 258 },
          control2: { x: 226, y: 202 },
          // Điểm dừng ở đúng lưng chừng thân chữ, đầu nét hướng nhẹ vào trong
          end: { x: 196, y: 166 },
        },
      ],
      // Nét đơn liền mạch chạy chậm để bé dễ quan sát hướng rê bút
      durationMs: 7000,
    },
  ],
};
