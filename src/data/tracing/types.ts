export interface StrokePoint {
  x: number;
  y: number;
}

export interface StrokeCurve {
  control1: StrokePoint;
  control2: StrokePoint;
  end: StrokePoint;
}

export interface LetterStrokePath {
  start: StrokePoint;
  curves: StrokeCurve[];
  durationMs: number;
  pauseAfterMs?: number;
}

export interface TracingGridLayout {
  columns?: number;
  rows?: number;
  cellSize?: number;
  margin?: number;
}

export interface TracingGlyphConfig {
  text?: string;
  fontFamily?: string;
  fontWeight?: number | string;
  sizeScale?: number;
  x?: number;
  y?: number;
}

export interface LetterStrokeAnimation {
  letter: string;
  strokes: LetterStrokePath[];
  layout?: TracingGridLayout;
  glyph?: TracingGlyphConfig;
}
