export interface TracingGridLayout {
  columns?: number;
  rows?: number;
  cellSize?: number;
  margin?: number;
}

export interface TracingGlyphConfig {
  fontFamily?: string;
  sizeScale?: number;
  x?: number;
  y?: number;
}

export interface LetterStrokeAnimation {
  letter: string;
  layout?: TracingGridLayout;
  glyph?: TracingGlyphConfig;
}
