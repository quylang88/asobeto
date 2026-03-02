export interface TracingGridLayout {
  columns?: number;
  rows?: number;
  cellSize?: number;
  margin?: number;
}

export interface TracingGridMetrics {
  margin: number;
  columns: number;
  rows: number;
  cellSize: number;
  drawAreaWidth: number;
  drawAreaHeight: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface TracingGlyphConfig {
  fontFamily?: string;
  sizeScale?: number;
  x?: number;
  y?: number;
}

export interface TracingStrokePoint {
  x: number;
  y: number;
}

export interface TracingPausePoint {
  pointIndex: number;
  pauseMs?: number;
}

export interface TracingPauseAnchor {
  point: TracingStrokePoint;
  pauseMs?: number;
}

export interface TracingStrokePath {
  points: TracingStrokePoint[];
  durationMs?: number;
  pauseBeforeMs?: number;
  pauseAfterMs?: number;
  pausePoints?: TracingPausePoint[];
  maskOverlapPx?: number;
}

export interface TracingAutoStrokeHint {
  mode?: "centerline" | "closedLoop" | "pathThroughAnchors";
  componentIndex?: number;
  initialDirection?: "left" | "right" | "up" | "down";
  start?: TracingStrokePoint;
  end?: TracingStrokePoint;
  pathAnchors?: TracingStrokePoint[];
  durationMs?: number;
  pauseBeforeMs?: number;
  pauseAfterMs?: number;
  pausePoints?: TracingPausePoint[];
  pauseAnchors?: TracingPauseAnchor[];
  maskOverlapPx?: number;
}

export interface TracingAutoDemoConfig {
  strokeCount?: number;
  strokeHints?: TracingAutoStrokeHint[];
}

export interface TracingDemoAnimationConfig {
  strategy?: "auto" | "manual";
  pauseMs?: number;
  strokeDurationMs?: number;
  strokes?: TracingStrokePath[];
  auto?: TracingAutoDemoConfig;
}

export interface LetterStrokeAnimation {
  letter: string;
  layout?: TracingGridLayout;
  glyph?: TracingGlyphConfig;
  demo?: TracingDemoAnimationConfig;
}
