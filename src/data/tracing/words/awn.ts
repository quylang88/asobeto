import { letterStrokeA } from "../letters/a";
import { letterStrokeAw } from "../letters/aw";
import { letterStrokeN } from "../letters/n";
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

const awBreveStroke = letterStrokeAw.strokes[letterStrokeAw.strokes.length - 1];

// Ghép từ "ăn" theo bố cục như "cá": canh baseline cùng hàng và tách riêng dấu của "ă".
// "ă" chiếm 3 cột đầu, "n" chiếm 3 cột kế tiếp (tổng 6 cột).
const awnWordStrokes: LetterStrokePath[] = [
  ...remapAnimationToBounds(
    {
      letter: "a",
      strokes: letterStrokeA.strokes,
    },
    {
      minX: 20,
      maxX: 136,
      minY: 138,
      maxY: 272,
    },
  ),
  ...remapAnimationToBounds(
    {
      letter: "breve",
      strokes: awBreveStroke ? [awBreveStroke] : [],
    },
    {
      // Dời dấu ă sang trái để cân đối hơn trên chữ a (x~71)
      minX: 48,
      maxX: 88,
      minY: 100,
      maxY: 120,
    },
  ),
  ...remapAnimationToBounds(
    letterStrokeN,
    {
      minX: 144,
      maxX: 270,
      minY: 138,
      maxY: 272,
    },
    {
      // Explicit source bounds để loại bỏ control point y=300 gây lệch baseline
      minX: 4,
      maxX: 240,
      minY: 140,
      maxY: 270,
    },
  ),
];

export const wordStrokeAwn: LetterStrokeAnimation = {
  letter: "ăn",
  layout: {
    columns: 6,
    rows: 4,
    cellSize: 46,
  },
  strokes: awnWordStrokes,
};
