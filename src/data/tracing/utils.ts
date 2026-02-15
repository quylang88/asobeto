import { TracingGridMetrics } from "./types";

export const SOURCE_CANVAS_SIZE = 280;
export const DEFAULT_WRITING_GRID_MARGIN = 8;
export const DEFAULT_WRITING_GRID_COLUMNS = 3;
export const DEFAULT_WRITING_GRID_ROWS = 4;
export const DEFAULT_WRITING_GRID_CELL_SIZE = 70;

export function createTracingGridMetrics(layout?: {
  margin?: number;
  columns?: number;
  rows?: number;
  cellSize?: number;
}): TracingGridMetrics {
  const margin = layout?.margin ?? DEFAULT_WRITING_GRID_MARGIN;
  const columns = layout?.columns ?? DEFAULT_WRITING_GRID_COLUMNS;
  const rows = layout?.rows ?? DEFAULT_WRITING_GRID_ROWS;
  const cellSize = layout?.cellSize ?? DEFAULT_WRITING_GRID_CELL_SIZE;
  const drawAreaWidth = columns * cellSize;
  const drawAreaHeight = rows * cellSize;

  return {
    margin,
    columns,
    rows,
    cellSize,
    drawAreaWidth,
    drawAreaHeight,
    canvasWidth: drawAreaWidth + margin * 2,
    canvasHeight: drawAreaHeight + margin * 2,
  };
}

export const DEFAULT_TRACING_GRID_METRICS = createTracingGridMetrics();

export const LETTER_TRACING_CANVAS_WIDTH =
  DEFAULT_TRACING_GRID_METRICS.canvasWidth;
export const LETTER_TRACING_CANVAS_HEIGHT =
  DEFAULT_TRACING_GRID_METRICS.canvasHeight;
