import { letterStrokeA } from "../letters/a";
import { letterStrokeC } from "../letters/c";
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

// Dấu sắc dùng riêng cho từ "cá": nét ngắn, hướng dựng lên trên rõ hơn.
export const wordToneStrokeCaSac: LetterStrokeAnimation = {
  letter: "tone-sac",
  strokes: [
    {
      start: { x: 140, y: 138 },
      curves: [
        {
          control1: { x: 148, y: 114 },
          control2: { x: 160, y: 92 },
          end: { x: 170, y: 66 },
        },
      ],
      durationMs: 1400,
    },
  ],
};

// Ghép từ "cá": c nằm ô 1-2, a nằm ô 3-4-5, dấu sắc nằm phía trên chữ a.
const caWordStrokes: LetterStrokePath[] = [
  ...remapAnimationToBounds(letterStrokeC, {
    minX: 12,
    maxX: 108,
    minY: 138,
    maxY: 272,
  }),
  ...remapAnimationToBounds(letterStrokeA, {
    minX: 122,
    maxX: 272,
    minY: 138,
    maxY: 272,
  }),
  ...remapAnimationToBounds(wordToneStrokeCaSac, {
    // Dời dấu sắc sang trái thêm và dựng hướng lên trên rõ hơn.
    minX: 184,
    maxX: 214,
    minY: 78,
    maxY: 114,
  }),
];

export const wordStrokeCas: LetterStrokeAnimation = {
  letter: "cá",
  // Dùng lưới 5 cột: c ở ô 1-2, a ở ô 3-4-5.
  layout: {
    columns: 5,
    rows: 4,
    // Thu gọn kích thước ô để tổng bề ngang vẫn vừa khung mobile.
    cellSize: 56,
  },
  strokes: caWordStrokes,
};
