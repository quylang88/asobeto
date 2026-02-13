import { type TracingGridMetrics, type TracingStrokePath } from "./types";

/**
 * Generates the stroke path for the letter 'a' based on the grid lines.
 * This function calculates the coordinates dynamically to ensure perfect alignment
 * with the visual grid lines (Line 1, Line 2, Line 3).
 *
 * @param metrics The grid metrics (rows, columns, cellSize, etc.)
 * @returns An array of TracingStrokePath objects.
 */
export function generateStrokePathForLetterA(
  metrics: TracingGridMetrics,
): TracingStrokePath[] {
  // Line 1 (Baseline): Bottom of the grid cell (y = rows * cellSize)
  // For standard 4-row grid, Line 1 is at y=280.
  const line1Y = metrics.drawAreaHeight;

  // Line 3 (Top): Two grid units above Line 1 (y = line1Y - 2 * cellSize)
  // For standard 4-row grid, Line 3 is at y=140.
  const line3Y = line1Y - 2 * metrics.cellSize;

  // Line 2 (Middle): One grid unit above Line 1 (y = line1Y - cellSize)
  // For standard 4-row grid, Line 2 is at y=210.
  const line2Y = line1Y - metrics.cellSize;

  // Calculate geometric properties
  const letterHeight = line1Y - line3Y; // 140px
  const letterWidth = letterHeight * 0.75; // ~105px
  const centerX = metrics.drawAreaWidth / 2; // 140px
  const leftX = centerX - letterWidth / 2; // ~88px
  const rightX = centerX + letterWidth / 2; // ~192px
  const stemX = rightX; // The stem aligns with the right edge of the oval

  // Stroke 1: Closed Curve (Cong kín)
  // Start below Line 3 on the right side, curve up-left, down-left, down-right, up-right to close.
  const stroke1: TracingStrokePath = {
    points: [
      { x: rightX, y: line3Y + letterHeight * 0.25 }, // Start: Right, slightly below top (y~175)
      { x: rightX - letterWidth * 0.1, y: line3Y + letterHeight * 0.1 }, // Control point
      { x: centerX, y: line3Y }, // Top Center (Line 3)
      { x: leftX + letterWidth * 0.1, y: line3Y + letterHeight * 0.1 }, // Control point
      { x: leftX, y: line2Y }, // Left Center (Line 2)
      { x: leftX + letterWidth * 0.1, y: line1Y - letterHeight * 0.1 }, // Control point
      { x: centerX, y: line1Y }, // Bottom Center (Line 1)
      { x: rightX - letterWidth * 0.1, y: line1Y - letterHeight * 0.1 }, // Control point
      { x: rightX, y: line2Y }, // Right Center (Line 2) - overlaps stem logic slightly
      { x: rightX, y: line3Y + letterHeight * 0.25 }, // Close Loop
    ],
    durationMs: 1600,
    pauseAfterMs: 250,
  };

  // Stroke 2: Reverse Hook (Móc ngược)
  // Start at Line 3 (Top Right), go straight down to Line 1 (Bottom Right), then hook up to Line 2.
  const stroke2: TracingStrokePath = {
    points: [
      { x: stemX, y: line3Y }, // Start: Top Right (Line 3)
      { x: stemX, y: line2Y }, // Middle Right (Line 2)
      { x: stemX, y: line1Y }, // Bottom Right (Line 1)
      { x: stemX + letterWidth * 0.15, y: line1Y - letterHeight * 0.05 }, // Hook Start
      { x: stemX + letterWidth * 0.25, y: line2Y }, // Hook End (Line 2)
    ],
    durationMs: 1200,
  };

  return [stroke1, stroke2];
}
