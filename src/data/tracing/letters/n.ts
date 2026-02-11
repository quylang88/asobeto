import { LetterStrokeAnimation } from "../types";

export const letterStrokeN: LetterStrokeAnimation = {
  letter: "n",
  // Chữ "n" mẫu dùng 3 ô ngang để bám bố cục ảnh tham chiếu.
  layout: {
    columns: 4,
    rows: 4,
  },
  strokes: [
    {
      // Nét 1: Móc trên trái. Bắt đầu từ dòng kẻ ngang 2 (y=210) trong ô 1.
      start: { x: 4, y: 170 },
      curves: [
        {
          control1: { x: 15, y: 155 },
          control2: { x: 30, y: 143 },
          end: { x: 45, y: 143 },
        },
        {
          control1: { x: 55, y: 143 },
          control2: { x: 65, y: 200 },
          end: { x: 70, y: 270 },
        },
      ],
      durationMs: 2300,
      pauseAfterMs: 800,
    },
    {
      // Nét 2: Móc hai đầu. Bắt đầu từ chân nét 1 (x=70, y=210), vòng lên ô 2, xuống ô 3 và móc lên.
      start: { x: 73, y: 210 },
      curves: [
        {
          control1: { x: 95, y: 160 },
          control2: { x: 125, y: 143 },
          end: { x: 150, y: 143 },
        },
        {
          // Xuống thẳng, dừng sớm hơn để chuẩn bị lượn móc mềm mại
          control1: { x: 165, y: 143 },
          control2: { x: 175, y: 200 },
          end: { x: 175, y: 255 },
        },
        {
          // Lượn cong tròn ở đáy (y=284) rồi hất lên êm ái
          control1: { x: 178, y: 284 },
          control2: { x: 225, y: 255 },
          end: { x: 240, y: 210 },
        },
      ],
      durationMs: 3600,
    },
  ],
};
