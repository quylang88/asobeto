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
    strategy: "auto",
    pauseMs: 800,
    auto: {
      strokeCount: 2,
      strokeHints: [
        {
          // Nét 1: cong kín, đi từ phải sang trái và khép kín về điểm đặt bút.
          mode: "closedLoop",
          initialDirection: "left",
          start: { x: 170, y: 208 },
          end: { x: 170, y: 208 },
          pathAnchors: [
            { x: 124, y: 222 },
            { x: 100, y: 182 },
            { x: 140, y: 154 },
            { x: 168, y: 184 },
          ],
          durationMs: 1660,
          pauseAfterMs: 260,
        },
        {
          // Nét 2: móc ngược phải, chạy chồng lên cạnh phải của nét cong kín.
          mode: "pathThroughAnchors",
          initialDirection: "up",
          start: { x: 167, y: 198 },
          end: { x: 160, y: 160 },
          pathAnchors: [
            { x: 172, y: 166 },
            { x: 172, y: 110 },
            { x: 166, y: 142 },
          ],
          durationMs: 1160,
          maskOverlapPx: 2.4,
          pauseAnchors: [{ point: { x: 172, y: 110 }, pauseMs: 220 }],
        },
      ],
    },
  },
};
