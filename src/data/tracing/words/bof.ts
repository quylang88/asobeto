import { letterStrokeB } from "../letters/b";
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
  explicitSourceBounds?: StrokeBounds,
): LetterStrokePath[] {
  const sourceBounds = explicitSourceBounds || getAnimationBounds(animation);

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

// Dấu huyền cho "bò": đặt ngay trên chữ "o", nét ngắn nghiêng xuống trái.
export const wordToneStrokeBoHuyen: LetterStrokeAnimation = {
  letter: "tone-huyen-bo",
  strokes: [
    {
      start: { x: 192, y: 66 },
      curves: [
        {
          control1: { x: 182, y: 90 },
          control2: { x: 170, y: 112 },
          end: { x: 162, y: 136 },
        },
      ],
      durationMs: 1400,
    },
  ],
};

// Ghép từ "bò": b ở bên trái, o ở bên phải, dấu huyền trên o.
const boWordStrokes: LetterStrokePath[] = [
  ...remapAnimationToBounds(
    letterStrokeB,
    {
      minX: 38,
      maxX: 176,
      minY: 6,
      maxY: 279,
    },
    {
      minX: 48,
      maxX: 268,
      minY: 6,
      maxY: 282,
    },
  ),
  ...remapAnimationToBounds(letterStrokeO, {
    minX: 176,
    maxX: 270,
    minY: 168,
    maxY: 272,
  }),
  ...remapAnimationToBounds(wordToneStrokeBoHuyen, {
    minX: 220,
    maxX: 249,
    minY: 150,
    maxY: 135,
  }),
];

export const wordStrokeBof: LetterStrokeAnimation = {
  letter: "bò",
  layout: {
    columns: 4,
    rows: 5,
    cellSize: 56,
  },
  strokes: boWordStrokes,
};

