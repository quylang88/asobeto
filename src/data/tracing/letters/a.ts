import { type LetterStrokeAnimation } from "../types";

export const letterStrokeA: LetterStrokeAnimation = {
  letter: "a",
  layout: {
    columns: 3,
    rows: 4,
  },
  glyph: {
    x: 42,
    y: 136,
    sizeScale: 2,
  },
  demo: {
    strategy: "manual",
    pauseMs: 800,
    strokes: [
      {
        // Nét 1 (Cong kín): Đặt bút dưới đường kẻ 3 một chút, viết một nét cong kín lượn lên trên từ phải sang trái.
        points: [
          { x: 166, y: 172 }, // Start (Right, below top)
          { x: 164, y: 160 },
          { x: 154, y: 154 }, // Top Right
          { x: 135, y: 154 }, // Top Center (Line 3 ~ y=154)
          { x: 116, y: 160 },
          { x: 106, y: 172 },
          { x: 100, y: 188 }, // Left Edge
          { x: 106, y: 204 },
          { x: 116, y: 216 },
          { x: 135, y: 222 }, // Bottom Center (Line 1 ~ y=222)
          { x: 154, y: 216 },
          { x: 164, y: 204 },
          { x: 166, y: 188 },
          { x: 166, y: 172 }, // Close loop at start
        ],
        durationMs: 1600,
        pauseAfterMs: 250,
      },
      {
        // Nét 2 (Móc ngược phải): Từ đường kẻ 3, viết nét móc ngược phải chạm đường kẻ 1 rồi hất lên.
        points: [
          { x: 166, y: 154 }, // Start at Top (Line 3) - overlapping right edge of stroke 1
          { x: 166, y: 170 },
          { x: 166, y: 188 },
          { x: 166, y: 206 },
          { x: 166, y: 222 }, // Touch Bottom (Line 1)
          { x: 174, y: 218 }, // Start Hook
          { x: 182, y: 206 },
          { x: 186, y: 188 }, // End at Line 2 (Middle ~ y=188)
        ],
        durationMs: 1200,
      },
    ],
  },
};
