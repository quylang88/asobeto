import { letterStrokeC } from "../letters/c";
import { letterStrokeO } from "../letters/o";
import {
  type LetterStrokeAnimation,
  type LetterStrokePath,
  type StrokePoint,
} from "../types";

interface StrokeBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface BoundsTarget {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function includePoint(bounds: StrokeBounds, point: StrokePoint): StrokeBounds {
  return {
    minX: Math.min(bounds.minX, point.x),
    maxX: Math.max(bounds.maxX, point.x),
    minY: Math.min(bounds.minY, point.y),
    maxY: Math.max(bounds.maxY, point.y),
  };
}

function getAnimationBounds(animation: LetterStrokeAnimation): StrokeBounds {
  const initial: StrokeBounds = {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  return animation.strokes.reduce((strokeBounds, stroke) => {
    let nextBounds = includePoint(strokeBounds, stroke.start);
    for (const curve of stroke.curves) {
      nextBounds = includePoint(nextBounds, curve.control1);
      nextBounds = includePoint(nextBounds, curve.control2);
      nextBounds = includePoint(nextBounds, curve.end);
    }
    return nextBounds;
  }, initial);
}

function mapPointIntoBounds(
  point: StrokePoint,
  source: StrokeBounds,
  target: BoundsTarget,
): StrokePoint {
  const sourceWidth = Math.max(1, source.maxX - source.minX);
  const sourceHeight = Math.max(1, source.maxY - source.minY);
  const targetWidth = target.maxX - target.minX;
  const targetHeight = target.maxY - target.minY;

  return {
    x: target.minX + ((point.x - source.minX) / sourceWidth) * targetWidth,
    y: target.minY + ((point.y - source.minY) / sourceHeight) * targetHeight,
  };
}

function remapAnimationToBounds(
  animation: LetterStrokeAnimation,
  target: BoundsTarget,
): LetterStrokePath[] {
  const sourceBounds = getAnimationBounds(animation);

  return animation.strokes.map((stroke) => ({
    ...stroke,
    start: mapPointIntoBounds(stroke.start, sourceBounds, target),
    curves: stroke.curves.map((curve) => ({
      control1: mapPointIntoBounds(curve.control1, sourceBounds, target),
      control2: mapPointIntoBounds(curve.control2, sourceBounds, target),
      end: mapPointIntoBounds(curve.end, sourceBounds, target),
    })),
  }));
}

// Dấu hỏi dùng cho từ "cỏ": nét cong mềm, đặt ngay phía trên chữ "o".
export const wordToneStrokeCoHoi: LetterStrokeAnimation = {
  letter: "tone-hoi",
  strokes: [
    {
      start: { x: 140, y: 100 },
      curves: [
        {
          control1: { x: 154, y: 84 },
          control2: { x: 166, y: 80 },
          end: { x: 172, y: 92 },
        },
        {
          control1: { x: 176, y: 104 },
          control2: { x: 168, y: 116 },
          end: { x: 158, y: 122 },
        },
      ],
      durationMs: 1600,
    },
  ],
};

// Ghép từ "cỏ": c ở ô 1-2, o ở ô 3-4, dấu hỏi ngay trên chữ o.
const coWordStrokes: LetterStrokePath[] = [
  ...remapAnimationToBounds(letterStrokeC, {
    minX: 35,
    maxX: 135,
    minY: 134,
    maxY: 272,
  }),
  ...remapAnimationToBounds(letterStrokeO, {
    minX: 140,
    maxX: 238,
    minY: 138,
    maxY: 272,
  }),
  ...remapAnimationToBounds(wordToneStrokeCoHoi, {
    minX: 184,
    maxX: 210,
    minY: 70,
    maxY: 115,
  }),
];

export const wordStrokeCor: LetterStrokeAnimation = {
  letter: "cỏ",
  layout: {
    columns: 4,
    rows: 4,
    cellSize: 70,
  },
  strokes: coWordStrokes,
};
