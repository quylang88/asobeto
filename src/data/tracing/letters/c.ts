import { LetterStrokeAnimation } from "../types";

// Nét chữ "c" thường chuẩn tiếng Việt: 1 nét cong liền mạch, mở bên phải
export const letterStrokeC: LetterStrokeAnimation = {
  letter: "c",
  strokes: [
    {
      // Nét 1: cong trái, điểm bắt đầu lùi lại, tránh chạm biên phải (x=186)
      start: { x: 155, y: 155 },
      curves: [
        {
          control1: { x: 148, y: 147 },
          control2: { x: 110, y: 136 },
          // Ôm cung trên theo ellipse để đầu nét tròn, không bị gắt
          end: { x: 84, y: 155 },
        },
        {
          control1: { x: 56, y: 172 },
          control2: { x: 44, y: 198 },
          // Hạ nét trái xuống đáy
          end: { x: 52, y: 228 },
        },
        {
          control1: { x: 60, y: 256 },
          control2: { x: 84, y: 270 },
          // Chạy đáy tròn rồi tiến dần sang phải
          end: { x: 114, y: 270 },
        },
        {
          control1: { x: 140, y: 270 },
          control2: { x: 168, y: 260 },
          // Kết thúc ở khe hở bên phải với độ cong mềm
          end: { x: 175, y: 247 },
        },
      ],
      // Nét đơn liền mạch chạy chậm để bé quan sát rõ hướng tô
      durationMs: 5800,
    },
  ],
};
