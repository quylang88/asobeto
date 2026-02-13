import { type LetterStrokeAnimation } from "../types";
import { generateStrokePathForLetterA } from "../stroke-generators";

// Define the layout manually here since we need the grid metrics
// to generate the strokes.
const letterALayout = {
  columns: 3,
  rows: 4,
};

// Based on the layout, calculate the metrics for the strokes.
// Standard cell size is 70.
const cellSize = 70;
const columns = letterALayout.columns;
const rows = letterALayout.rows;
const metrics = {
  margin: 8,
  columns,
  rows,
  cellSize,
  drawAreaWidth: columns * cellSize, // 210
  drawAreaHeight: rows * cellSize,   // 280
  canvasWidth: columns * cellSize + 16,
  canvasHeight: rows * cellSize + 16,
};

export const letterStrokeA: LetterStrokeAnimation = {
  letter: "a",
  layout: letterALayout,
  glyph: {
    x: 42,
    y: 136,
    sizeScale: 2,
  },
  demo: {
    strategy: "manual",
    pauseMs: 800,
    strokes: generateStrokePathForLetterA(metrics),
  },
};
