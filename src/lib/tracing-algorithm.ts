import {
  type TracingAutoStrokeHint,
  type TracingPausePoint,
  type TracingStrokePoint,
} from "../data/tracing/types";

export const SOURCE_CANVAS_SIZE = 280;
export const DEFAULT_WRITING_GRID_MARGIN = 8;
export const DEFAULT_WRITING_GRID_COLUMNS = 3;
export const DEFAULT_WRITING_GRID_ROWS = 4;
export const DEFAULT_WRITING_GRID_CELL_SIZE = 70;

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

export interface DemoCanvasPoint {
  x: number;
  y: number;
}

export interface GeneratedStrokeCandidate {
  points: TracingStrokePoint[];
  length: number;
  orderValue: number;
  componentId: number;
  hint?: TracingAutoStrokeHint;
}

export interface GlyphMaskConstraint {
  mask: Uint8Array;
  width: number;
  height: number;
  metrics: TracingGridMetrics;
}

const EIGHT_NEIGHBOR_OFFSETS: Array<[number, number]> = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

const MAX_SAFE_MERGE_CONNECTOR_DISTANCE = 40;
const SMOOTHING_PASSES = 1;
const MIN_POINT_SPACING = 3;

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

function clamp01(value: number) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function mapCanvasPointToSource(
  point: DemoCanvasPoint,
  metrics: TracingGridMetrics,
): TracingStrokePoint {
  const normalizedX = clamp01(
    (point.x - metrics.margin) / metrics.drawAreaWidth,
  );
  const normalizedY = clamp01(
    (point.y - metrics.margin) / metrics.drawAreaHeight,
  );
  return {
    x: normalizedX * SOURCE_CANVAS_SIZE,
    y: normalizedY * SOURCE_CANVAS_SIZE,
  };
}

export function mapSourcePointToCanvas(
  point: DemoCanvasPoint,
  metrics: TracingGridMetrics,
): DemoCanvasPoint {
  return {
    x: metrics.margin + (point.x / SOURCE_CANVAS_SIZE) * metrics.drawAreaWidth,
    y: metrics.margin + (point.y / SOURCE_CANVAS_SIZE) * metrics.drawAreaHeight,
  };
}

export function mapSourcePointToMaskPixel(
  point: TracingStrokePoint,
  constraint: GlyphMaskConstraint,
): { x: number; y: number } {
  const { metrics, width, height } = constraint;
  const mappedX = Math.round(
    metrics.margin + (point.x / SOURCE_CANVAS_SIZE) * metrics.drawAreaWidth,
  );
  const mappedY = Math.round(
    metrics.margin + (point.y / SOURCE_CANVAS_SIZE) * metrics.drawAreaHeight,
  );
  return {
    x: Math.max(0, Math.min(width - 1, mappedX)),
    y: Math.max(0, Math.min(height - 1, mappedY)),
  };
}

export function readBinaryMaskPixel(
  mask: Uint8Array,
  width: number,
  x: number,
  y: number,
): 0 | 1 {
  return mask[y * width + x] === 1 ? 1 : 0;
}

function zhangSuenTransitionCount(
  p2: 0 | 1,
  p3: 0 | 1,
  p4: 0 | 1,
  p5: 0 | 1,
  p6: 0 | 1,
  p7: 0 | 1,
  p8: 0 | 1,
  p9: 0 | 1,
): number {
  const sequence: Array<0 | 1> = [p2, p3, p4, p5, p6, p7, p8, p9, p2];
  let transitions = 0;
  for (let index = 0; index < 8; index += 1) {
    if (sequence[index] === 0 && sequence[index + 1] === 1) {
      transitions += 1;
    }
  }
  return transitions;
}

export function skeletonizeBinaryMask(
  inputMask: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  const mask = new Uint8Array(inputMask);
  let didChange = true;
  let iterations = 0;
  const maxIterations = 200;

  while (didChange && iterations < maxIterations) {
    didChange = false;
    iterations += 1;

    const pixelsToDeletePass1: number[] = [];
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const pixelIndex = y * width + x;
        if (mask[pixelIndex] !== 1) continue;

        const p2 = readBinaryMaskPixel(mask, width, x, y - 1);
        const p3 = readBinaryMaskPixel(mask, width, x + 1, y - 1);
        const p4 = readBinaryMaskPixel(mask, width, x + 1, y);
        const p5 = readBinaryMaskPixel(mask, width, x + 1, y + 1);
        const p6 = readBinaryMaskPixel(mask, width, x, y + 1);
        const p7 = readBinaryMaskPixel(mask, width, x - 1, y + 1);
        const p8 = readBinaryMaskPixel(mask, width, x - 1, y);
        const p9 = readBinaryMaskPixel(mask, width, x - 1, y - 1);

        const neighborCount = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (neighborCount < 2 || neighborCount > 6) continue;
        if (zhangSuenTransitionCount(p2, p3, p4, p5, p6, p7, p8, p9) !== 1) {
          continue;
        }
        if (p2 * p4 * p6 !== 0) continue;
        if (p4 * p6 * p8 !== 0) continue;

        pixelsToDeletePass1.push(pixelIndex);
      }
    }

    if (pixelsToDeletePass1.length > 0) {
      didChange = true;
      pixelsToDeletePass1.forEach((pixelIndex) => {
        mask[pixelIndex] = 0;
      });
    }

    const pixelsToDeletePass2: number[] = [];
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const pixelIndex = y * width + x;
        if (mask[pixelIndex] !== 1) continue;

        const p2 = readBinaryMaskPixel(mask, width, x, y - 1);
        const p3 = readBinaryMaskPixel(mask, width, x + 1, y - 1);
        const p4 = readBinaryMaskPixel(mask, width, x + 1, y);
        const p5 = readBinaryMaskPixel(mask, width, x + 1, y + 1);
        const p6 = readBinaryMaskPixel(mask, width, x, y + 1);
        const p7 = readBinaryMaskPixel(mask, width, x - 1, y + 1);
        const p8 = readBinaryMaskPixel(mask, width, x - 1, y);
        const p9 = readBinaryMaskPixel(mask, width, x - 1, y - 1);

        const neighborCount = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
        if (neighborCount < 2 || neighborCount > 6) continue;
        if (zhangSuenTransitionCount(p2, p3, p4, p5, p6, p7, p8, p9) !== 1) {
          continue;
        }
        if (p2 * p4 * p8 !== 0) continue;
        if (p2 * p6 * p8 !== 0) continue;

        pixelsToDeletePass2.push(pixelIndex);
      }
    }

    if (pixelsToDeletePass2.length > 0) {
      didChange = true;
      pixelsToDeletePass2.forEach((pixelIndex) => {
        mask[pixelIndex] = 0;
      });
    }
  }

  return mask;
}

export function extractConnectedComponents(
  mask: Uint8Array,
  width: number,
  height: number,
  minPixels: number = 10,
): number[][] {
  const visited = new Uint8Array(mask.length);
  const components: number[][] = [];

  for (let pixelIndex = 0; pixelIndex < mask.length; pixelIndex += 1) {
    if (mask[pixelIndex] !== 1 || visited[pixelIndex] === 1) continue;

    const queue: number[] = [pixelIndex];
    const componentPixels: number[] = [];
    visited[pixelIndex] = 1;

    while (queue.length > 0) {
      const currentPixel = queue.shift();
      if (currentPixel === undefined) break;
      componentPixels.push(currentPixel);

      const currentX = currentPixel % width;
      const currentY = Math.floor(currentPixel / width);

      for (const [offsetX, offsetY] of EIGHT_NEIGHBOR_OFFSETS) {
        const nextX = currentX + offsetX;
        const nextY = currentY + offsetY;
        if (
          nextX < 0 ||
          nextY < 0 ||
          nextX >= width ||
          nextY >= height
        ) {
          continue;
        }
        const nextPixel = nextY * width + nextX;
        if (mask[nextPixel] !== 1 || visited[nextPixel] === 1) continue;
        visited[nextPixel] = 1;
        queue.push(nextPixel);
      }
    }

    if (componentPixels.length >= minPixels) {
      components.push(componentPixels);
    }
  }

  return components;
}

export function getTrailStartOrderingValue(
  pixelIndex: number,
  width: number,
): number {
  const x = pixelIndex % width;
  const y = Math.floor(pixelIndex / width);
  return y * 10000 + x;
}

export function buildComponentAdjacency(
  componentPixels: number[],
  width: number,
  height: number,
): Map<number, number[]> {
  const componentPixelSet = new Set(componentPixels);
  const adjacency = new Map<number, number[]>();

  componentPixels.forEach((pixelIndex) => {
    const pixelX = pixelIndex % width;
    const pixelY = Math.floor(pixelIndex / width);
    const neighbors: number[] = [];

    EIGHT_NEIGHBOR_OFFSETS.forEach(([offsetX, offsetY]) => {
      const neighborX = pixelX + offsetX;
      const neighborY = pixelY + offsetY;
      if (
        neighborX < 0 ||
        neighborY < 0 ||
        neighborX >= width ||
        neighborY >= height
      ) {
        return;
      }
      const neighborIndex = neighborY * width + neighborX;
      if (!componentPixelSet.has(neighborIndex)) return;
      neighbors.push(neighborIndex);
    });

    neighbors.sort(
      (leftPixel, rightPixel) =>
        getTrailStartOrderingValue(leftPixel, width) -
        getTrailStartOrderingValue(rightPixel, width),
    );
    adjacency.set(pixelIndex, neighbors);
  });

  return adjacency;
}

function makePixelEdgeKey(
  pixelA: number,
  pixelB: number,
  totalPixels: number,
): number {
  const lower = pixelA < pixelB ? pixelA : pixelB;
  const higher = pixelA < pixelB ? pixelB : pixelA;
  return lower * totalPixels + higher;
}

export function buildCenterlineTrailsForComponent(
  componentPixels: number[],
  width: number,
  height: number,
  totalPixels: number,
): number[][] {
  const adjacency = buildComponentAdjacency(componentPixels, width, height);
  const visitedEdges = new Set<number>();

  const trails: number[][] = [];
  const isVisited = (pixelA: number, pixelB: number): boolean =>
    visitedEdges.has(makePixelEdgeKey(pixelA, pixelB, totalPixels));
  const markVisited = (pixelA: number, pixelB: number) => {
    visitedEdges.add(makePixelEdgeKey(pixelA, pixelB, totalPixels));
  };
  const appendTrail = (trail: number[]) => {
    if (trail.length > 1) {
      trails.push(trail);
    }
  };
  const walkTrailFromEdge = (
    startPixel: number,
    nextPixel: number,
  ): number[] => {
    const trail = [startPixel, nextPixel];
    markVisited(startPixel, nextPixel);

    let previousPixel = startPixel;
    let currentPixel = nextPixel;

    while (true) {
      const neighbors = adjacency.get(currentPixel) ?? [];
      const nextUnvisitedPixel = neighbors.find(
        (neighborPixel) =>
          neighborPixel !== previousPixel &&
          !isVisited(currentPixel, neighborPixel),
      );
      if (nextUnvisitedPixel === undefined) {
        break;
      }
      trail.push(nextUnvisitedPixel);
      markVisited(currentPixel, nextUnvisitedPixel);

      previousPixel = currentPixel;
      currentPixel = nextUnvisitedPixel;
      const currentDegree = (adjacency.get(currentPixel) ?? []).length;
      if (currentDegree !== 2) {
        break;
      }
    }

    return trail;
  };

  const keyNodes = componentPixels
    .filter((pixelIndex) => (adjacency.get(pixelIndex)?.length ?? 0) !== 2)
    .sort(
      (leftPixel, rightPixel) =>
        getTrailStartOrderingValue(leftPixel, width) -
        getTrailStartOrderingValue(rightPixel, width),
    );

  keyNodes.forEach((keyPixel) => {
    const neighbors = adjacency.get(keyPixel) ?? [];
    neighbors.forEach((neighborPixel) => {
      if (isVisited(keyPixel, neighborPixel)) return;
      appendTrail(walkTrailFromEdge(keyPixel, neighborPixel));
    });
  });

  componentPixels.forEach((pixelIndex) => {
    const neighbors = adjacency.get(pixelIndex) ?? [];
    neighbors.forEach((neighborPixel) => {
      if (isVisited(pixelIndex, neighborPixel)) return;
      appendTrail(walkTrailFromEdge(pixelIndex, neighborPixel));
    });
  });

  return trails;
}

function smoothCanvasPolylineWithChaikin(
  points: DemoCanvasPoint[],
  iterations: number = 2,
): DemoCanvasPoint[] {
  if (points.length < 3 || iterations <= 0) return points;

  let working = points.map((point) => ({ ...point }));
  for (
    let iterationIndex = 0;
    iterationIndex < iterations;
    iterationIndex += 1
  ) {
    if (working.length < 3) break;
    const smoothed: DemoCanvasPoint[] = [working[0]];
    for (let pointIndex = 0; pointIndex < working.length - 1; pointIndex += 1) {
      const currentPoint = working[pointIndex];
      const nextPoint = working[pointIndex + 1];
      const qPoint: DemoCanvasPoint = {
        x: currentPoint.x * 0.75 + nextPoint.x * 0.25,
        y: currentPoint.y * 0.75 + nextPoint.y * 0.25,
      };
      const rPoint: DemoCanvasPoint = {
        x: currentPoint.x * 0.25 + nextPoint.x * 0.75,
        y: currentPoint.y * 0.25 + nextPoint.y * 0.75,
      };
      smoothed.push(qPoint, rPoint);
    }
    smoothed.push(working[working.length - 1]);
    working = smoothed;
  }

  return working;
}

function resampleCanvasPointsByMinDistance(
  points: DemoCanvasPoint[],
  minDistance: number,
): DemoCanvasPoint[] {
  if (points.length < 2) return points;
  const minDistanceSquared = minDistance * minDistance;
  const sampled: DemoCanvasPoint[] = [points[0]];
  let lastKept = points[0];

  for (let pointIndex = 1; pointIndex < points.length - 1; pointIndex += 1) {
    const currentPoint = points[pointIndex];
    const deltaX = currentPoint.x - lastKept.x;
    const deltaY = currentPoint.y - lastKept.y;
    if (deltaX * deltaX + deltaY * deltaY < minDistanceSquared) continue;
    sampled.push(currentPoint);
    lastKept = currentPoint;
  }

  sampled.push(points[points.length - 1]);
  return sampled;
}

export function getStrokePointDistance(
  start: TracingStrokePoint,
  end: TracingStrokePoint,
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function simplifyTrailToSourcePoints(
  trail: number[],
  width: number,
  metrics: TracingGridMetrics,
): TracingStrokePoint[] {
  const canvasPoints = trail.map((pixelIndex) => ({
    x: pixelIndex % width,
    y: Math.floor(pixelIndex / width),
  }));

  if (canvasPoints.length < 2) return [];

  const sampledCanvasPoints = resampleCanvasPointsByMinDistance(
    canvasPoints,
    1.2,
  );
  const smoothedCanvasPoints = smoothCanvasPolylineWithChaikin(
    sampledCanvasPoints,
    2,
  );
  const simplifiedCanvasPoints = resampleCanvasPointsByMinDistance(
    smoothedCanvasPoints,
    1.75,
  );

  const sourcePoints: TracingStrokePoint[] = [];
  simplifiedCanvasPoints.forEach((point) => {
    const sourcePoint = mapCanvasPointToSource(point, metrics);
    const previousPoint = sourcePoints[sourcePoints.length - 1];
    if (
      previousPoint &&
      getStrokePointDistance(previousPoint, sourcePoint) < 0.35
    ) {
      return;
    }
    sourcePoints.push(sourcePoint);
  });

  if (sourcePoints.length < 2) return [];
  return sourcePoints;
}

export function createStrokeCandidateFromPixelPath(
  pixelPath: number[],
  width: number,
  metrics: TracingGridMetrics,
  componentId: number,
  hint?: TracingAutoStrokeHint,
): GeneratedStrokeCandidate | null {
  const sourcePoints = simplifyTrailToSourcePoints(pixelPath, width, metrics);
  if (sourcePoints.length < 2) return null;
  const adjustedPoints = [...sourcePoints];
  if (hint?.start) {
    adjustedPoints[0] = { ...hint.start };
  }
  if (hint?.end) {
    adjustedPoints[adjustedPoints.length - 1] = { ...hint.end };
  }
  return createStrokeCandidate(adjustedPoints, componentId, hint);
}

function dedupeConsecutiveStrokePoints(
  points: TracingStrokePoint[],
): TracingStrokePoint[] {
  if (points.length <= 1) return points;
  const deduped: TracingStrokePoint[] = [points[0]];
  for (let index = 1; index < points.length; index += 1) {
    const currentPoint = points[index];
    const previousPoint = deduped[deduped.length - 1];
    if (
      currentPoint.x === previousPoint.x &&
      currentPoint.y === previousPoint.y
    ) {
      continue;
    }
    deduped.push(currentPoint);
  }
  return deduped;
}

function smoothStrokePoints(
  points: TracingStrokePoint[],
  passes: number = SMOOTHING_PASSES,
): TracingStrokePoint[] {
  if (points.length < 3 || passes <= 0) return points;

  let working = points.map((point) => ({ ...point }));
  for (let passIndex = 0; passIndex < passes; passIndex += 1) {
    const smoothed = working.map((point) => ({ ...point }));
    for (let pointIndex = 1; pointIndex < working.length - 1; pointIndex += 1) {
      const previousPoint = working[pointIndex - 1];
      const currentPoint = working[pointIndex];
      const nextPoint = working[pointIndex + 1];
      smoothed[pointIndex] = {
        x: (previousPoint.x + currentPoint.x * 2 + nextPoint.x) / 4,
        y: (previousPoint.y + currentPoint.y * 2 + nextPoint.y) / 4,
      };
    }
    working = smoothed;
  }

  return working;
}

function reduceStrokePointDensity(
  points: TracingStrokePoint[],
  minSpacing: number = MIN_POINT_SPACING,
): TracingStrokePoint[] {
  if (points.length < 3) return points;

  const reduced: TracingStrokePoint[] = [points[0]];
  let lastKeptPoint = points[0];

  for (let pointIndex = 1; pointIndex < points.length - 1; pointIndex += 1) {
    const currentPoint = points[pointIndex];
    if (getStrokePointDistance(lastKeptPoint, currentPoint) < minSpacing) {
      continue;
    }
    reduced.push(currentPoint);
    lastKeptPoint = currentPoint;
  }

  reduced.push(points[points.length - 1]);
  return reduced;
}

export function getStrokePathLength(points: TracingStrokePoint[]): number {
  if (points.length < 2) return 0;
  let pathLength = 0;
  for (let index = 1; index < points.length; index += 1) {
    pathLength += getStrokePointDistance(points[index - 1], points[index]);
  }
  return pathLength;
}

export function getStrokeOrderingValue(points: TracingStrokePoint[]): number {
  if (points.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...points.map((point) => point.y * 10000 + point.x));
}

export function createStrokeCandidate(
  points: TracingStrokePoint[],
  componentId: number,
  hint?: TracingAutoStrokeHint,
): GeneratedStrokeCandidate {
  const dedupedPoints = dedupeConsecutiveStrokePoints(points);
  const smoothedPoints = smoothStrokePoints(dedupedPoints);
  const reducedPoints = reduceStrokePointDensity(smoothedPoints);
  const normalizedPoints = dedupeConsecutiveStrokePoints(reducedPoints);
  return {
    points: normalizedPoints,
    length: getStrokePathLength(normalizedPoints),
    orderValue: getStrokeOrderingValue(normalizedPoints),
    componentId,
    hint,
  };
}

export function filterAutoStrokeCandidates(
  candidates: GeneratedStrokeCandidate[],
): GeneratedStrokeCandidate[] {
  if (candidates.length <= 1) return candidates;
  const longestLength = Math.max(
    ...candidates.map((candidate) => candidate.length),
  );
  const minAcceptedLength = Math.max(18, longestLength * 0.12);
  const filtered = candidates.filter(
    (candidate) => candidate.length >= minAcceptedLength,
  );
  return filtered.length > 0 ? filtered : candidates;
}

export interface SkeletonComponentModel {
  componentId: number;
  pixels: number[];
  adjacency: Map<number, number[]>;
  trails: number[][];
}

export function findNearestComponentPixel(
  componentPixels: number[],
  width: number,
  targetX: number,
  targetY: number,
): number | null {
  if (componentPixels.length === 0) return null;

  let nearestPixel = componentPixels[0];
  let nearestDistanceSquared = Number.POSITIVE_INFINITY;

  componentPixels.forEach((pixelIndex) => {
    const pixelX = pixelIndex % width;
    const pixelY = Math.floor(pixelIndex / width);
    const deltaX = pixelX - targetX;
    const deltaY = pixelY - targetY;
    const distanceSquared = deltaX * deltaX + deltaY * deltaY;
    if (distanceSquared < nearestDistanceSquared) {
      nearestDistanceSquared = distanceSquared;
      nearestPixel = pixelIndex;
    }
  });

  return nearestPixel;
}

export function findShortestPixelPath(
  adjacency: Map<number, number[]>,
  startPixel: number,
  endPixel: number,
  blockedPixel?: number,
): number[] | null {
  if (startPixel === endPixel) return [startPixel];
  if (blockedPixel !== undefined) {
    if (startPixel === blockedPixel || endPixel === blockedPixel) return null;
  }

  const queue: number[] = [startPixel];
  const visited = new Set<number>([startPixel]);
  const parentByPixel = new Map<number, number>();
  let queueCursor = 0;

  while (queueCursor < queue.length) {
    const currentPixel = queue[queueCursor];
    queueCursor += 1;

    const neighbors = adjacency.get(currentPixel) ?? [];
    for (const neighborPixel of neighbors) {
      if (neighborPixel === blockedPixel) continue;
      if (visited.has(neighborPixel)) continue;

      visited.add(neighborPixel);
      parentByPixel.set(neighborPixel, currentPixel);

      if (neighborPixel === endPixel) {
        const reversedPath: number[] = [endPixel];
        let walkerPixel = endPixel;

        while (walkerPixel !== startPixel) {
          const parentPixel = parentByPixel.get(walkerPixel);
          if (parentPixel === undefined) return null;
          reversedPath.push(parentPixel);
          walkerPixel = parentPixel;
        }

        return reversedPath.reverse();
      }

      queue.push(neighborPixel);
    }
  }

  return null;
}

export function pathMatchesInitialDirection(
  pixelPath: number[],
  width: number,
  initialDirection: TracingAutoStrokeHint["initialDirection"],
): boolean {
  if (!initialDirection || pixelPath.length < 2) return true;

  const firstPixel = pixelPath[0];
  const secondPixel = pixelPath[1];
  const deltaX = (secondPixel % width) - (firstPixel % width);
  const deltaY =
    Math.floor(secondPixel / width) - Math.floor(firstPixel / width);

  if (initialDirection === "left") return deltaX < 0;
  if (initialDirection === "right") return deltaX > 0;
  if (initialDirection === "up") return deltaY < 0;
  if (initialDirection === "down") return deltaY > 0;

  return true;
}

export function orientPixelPathByInitialDirection(
  pixelPath: number[],
  width: number,
  initialDirection: TracingAutoStrokeHint["initialDirection"],
): number[] {
  if (pixelPath.length < 2 || !initialDirection) return pixelPath;
  if (pathMatchesInitialDirection(pixelPath, width, initialDirection)) {
    return pixelPath;
  }
  return [...pixelPath].reverse();
}

export function orientClosedPixelPathByInitialDirection(
  pixelPath: number[],
  width: number,
  initialDirection: TracingAutoStrokeHint["initialDirection"],
): number[] {
  if (pixelPath.length < 4 || !initialDirection) return pixelPath;
  if (pathMatchesInitialDirection(pixelPath, width, initialDirection)) {
    return pixelPath;
  }

  const loopBody = pixelPath.slice(1, -1);
  const reversedLoop = [pixelPath[0], ...loopBody.reverse(), pixelPath[0]];
  return reversedLoop;
}

export function mapPathAnchorsToMaskPixels(
  anchors: TracingStrokePoint[] | undefined,
  constraint: GlyphMaskConstraint,
): Array<{ x: number; y: number }> {
  if (!anchors || anchors.length === 0) return [];
  return anchors.map((anchorPoint) =>
    mapSourcePointToMaskPixel(anchorPoint, constraint),
  );
}

export function scorePixelPathAgainstAnchors(
  pixelPath: number[],
  width: number,
  anchors: Array<{ x: number; y: number }>,
): number {
  if (anchors.length === 0 || pixelPath.length === 0) return 0;

  const pathPoints = pixelPath.map((pixelIndex) => ({
    x: pixelIndex % width,
    y: Math.floor(pixelIndex / width),
  }));
  let score = 0;
  let lastNearestIndex = -1;

  anchors.forEach((anchorPoint) => {
    let nearestIndex = 0;
    let bestDistanceSquared = Number.POSITIVE_INFINITY;

    pathPoints.forEach((pathPoint, pointIndex) => {
      const deltaX = pathPoint.x - anchorPoint.x;
      const deltaY = pathPoint.y - anchorPoint.y;
      const distanceSquared = deltaX * deltaX + deltaY * deltaY;
      if (distanceSquared < bestDistanceSquared) {
        bestDistanceSquared = distanceSquared;
        nearestIndex = pointIndex;
      }
    });

    score += Math.sqrt(bestDistanceSquared);
    if (nearestIndex < lastNearestIndex) {
      score += (lastNearestIndex - nearestIndex) * 6;
    }
    lastNearestIndex = Math.max(lastNearestIndex, nearestIndex);
  });

  return score;
}

export function resolveHintComponent(
  hint: TracingAutoStrokeHint,
  components: SkeletonComponentModel[],
  constraint: GlyphMaskConstraint,
): SkeletonComponentModel | null {
  if (components.length === 0) return null;

  if (hint.componentIndex !== undefined) {
    const hintedComponent = components[hint.componentIndex];
    if (hintedComponent) return hintedComponent;
  }

  const referencePoint =
    hint.start ??
    hint.pathAnchors?.[0] ??
    hint.pauseAnchors?.[0]?.point ??
    hint.end ??
    null;
  if (!referencePoint) return components[0];

  const maskPoint = mapSourcePointToMaskPixel(referencePoint, constraint);
  let bestComponent = components[0];
  let bestDistanceSquared = Number.POSITIVE_INFINITY;

  components.forEach((component) => {
    const nearestPixel = findNearestComponentPixel(
      component.pixels,
      constraint.width,
      maskPoint.x,
      maskPoint.y,
    );
    if (nearestPixel === null) return;

    const nearestX = nearestPixel % constraint.width;
    const nearestY = Math.floor(nearestPixel / constraint.width);
    const deltaX = nearestX - maskPoint.x;
    const deltaY = nearestY - maskPoint.y;
    const distanceSquared = deltaX * deltaX + deltaY * deltaY;
    if (distanceSquared < bestDistanceSquared) {
      bestDistanceSquared = distanceSquared;
      bestComponent = component;
    }
  });

  return bestComponent;
}

export function buildClosedLoopPixelPathFromHint(
  hint: TracingAutoStrokeHint,
  component: SkeletonComponentModel,
  constraint: GlyphMaskConstraint,
): number[] | null {
  if (!hint.start) return null;

  const startMaskPoint = mapSourcePointToMaskPixel(hint.start, constraint);
  const startPixel = findNearestComponentPixel(
    component.pixels,
    constraint.width,
    startMaskPoint.x,
    startMaskPoint.y,
  );
  if (startPixel === null) return null;

  const startNeighbors = component.adjacency.get(startPixel) ?? [];
  if (startNeighbors.length < 2) return null;

  const anchorMaskPoints = mapPathAnchorsToMaskPixels(
    hint.pathAnchors,
    constraint,
  );
  let bestCyclePath: number[] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (
    let leftIndex = 0;
    leftIndex < startNeighbors.length - 1;
    leftIndex += 1
  ) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < startNeighbors.length;
      rightIndex += 1
    ) {
      const leftNeighbor = startNeighbors[leftIndex];
      const rightNeighbor = startNeighbors[rightIndex];
      const connectingPath = findShortestPixelPath(
        component.adjacency,
        leftNeighbor,
        rightNeighbor,
        startPixel,
      );
      if (!connectingPath || connectingPath.length < 2) continue;

      const cyclePath = [startPixel, ...connectingPath, startPixel];
      const clockwisePath = orientClosedPixelPathByInitialDirection(
        cyclePath,
        constraint.width,
        hint.initialDirection,
      );
      const counterClockwisePath = [
        cyclePath[0],
        ...cyclePath.slice(1, -1).reverse(),
        cyclePath[0],
      ];

      [clockwisePath, counterClockwisePath].forEach((candidatePath) => {
        const anchorScore = scorePixelPathAgainstAnchors(
          candidatePath,
          constraint.width,
          anchorMaskPoints,
        );
        const directionPenalty = pathMatchesInitialDirection(
          candidatePath,
          constraint.width,
          hint.initialDirection,
        )
          ? 0
          : 12;
        const lengthPenalty =
          anchorMaskPoints.length > 0
            ? candidatePath.length * 0.045
            : -candidatePath.length;
        const totalScore = anchorScore + directionPenalty + lengthPenalty;
        if (totalScore < bestScore) {
          bestScore = totalScore;
          bestCyclePath = candidatePath;
        }
      });
    }
  }

  if (!bestCyclePath) return null;
  return bestCyclePath;
}

export function buildPathThroughAnchorsFromHint(
  hint: TracingAutoStrokeHint,
  component: SkeletonComponentModel,
  constraint: GlyphMaskConstraint,
): number[] | null {
  const waypoints: TracingStrokePoint[] = [];
  if (hint.start) waypoints.push(hint.start);
  const pathAnchors =
    hint.pathAnchors && hint.pathAnchors.length > 0
      ? hint.pathAnchors
      : hint.pauseAnchors?.map((pauseAnchor) => pauseAnchor.point) ?? [];
  pathAnchors.forEach((anchorPoint) => {
    waypoints.push(anchorPoint);
  });
  if (hint.end) waypoints.push(hint.end);
  if (waypoints.length < 2) return null;

  const waypointPixels = waypoints
    .map((waypoint) => {
      const maskPoint = mapSourcePointToMaskPixel(waypoint, constraint);
      return findNearestComponentPixel(
        component.pixels,
        constraint.width,
        maskPoint.x,
        maskPoint.y,
      );
    })
    .filter((pixelIndex): pixelIndex is number => pixelIndex !== null);
  if (waypointPixels.length < 2) return null;

  const dedupedWaypointPixels = waypointPixels.filter(
    (pixelIndex, waypointIndex) =>
      waypointIndex === 0 || pixelIndex !== waypointPixels[waypointIndex - 1],
  );
  if (dedupedWaypointPixels.length < 2) return null;

  const mergedPath: number[] = [];
  for (
    let waypointIndex = 0;
    waypointIndex < dedupedWaypointPixels.length - 1;
    waypointIndex += 1
  ) {
    const startPixel = dedupedWaypointPixels[waypointIndex];
    const endPixel = dedupedWaypointPixels[waypointIndex + 1];
    const segmentPath = findShortestPixelPath(
      component.adjacency,
      startPixel,
      endPixel,
    );
    if (!segmentPath || segmentPath.length < 1) return null;
    if (segmentPath.length === 1 && startPixel !== endPixel) return null;

    if (mergedPath.length === 0) {
      mergedPath.push(...segmentPath);
      continue;
    }

    mergedPath.push(...segmentPath.slice(1));
  }

  return orientPixelPathByInitialDirection(
    mergedPath,
    constraint.width,
    hint.initialDirection,
  );
}

function scoreCandidateForHint(
  candidate: GeneratedStrokeCandidate,
  hint: TracingAutoStrokeHint,
): { score: number; shouldReverse: boolean } {
  const points = candidate.points;
  const startPoint = points[0];
  const endPoint = points[points.length - 1];
  const startHint = hint.start;
  const endHint = hint.end;

  const directScore =
    (startHint ? getStrokePointDistance(startPoint, startHint) : 0) +
    (endHint ? getStrokePointDistance(endPoint, endHint) : 0);
  const reverseScore =
    (startHint ? getStrokePointDistance(endPoint, startHint) : 0) +
    (endHint ? getStrokePointDistance(startPoint, endHint) : 0);

  if (reverseScore < directScore) {
    return { score: reverseScore, shouldReverse: true };
  }

  return { score: directScore, shouldReverse: false };
}

function mergeTwoStrokePointLists(
  firstPoints: TracingStrokePoint[],
  secondPoints: TracingStrokePoint[],
): { points: TracingStrokePoint[]; connectorDistance: number } {
  const connectorDistance = getStrokePointDistance(
    firstPoints[firstPoints.length - 1],
    secondPoints[0],
  );
  const mergedPoints = dedupeConsecutiveStrokePoints([
    ...firstPoints,
    ...secondPoints,
  ]);
  return {
    points: mergedPoints,
    connectorDistance,
  };
}

function isMaskFilledNear(
  mask: Uint8Array,
  width: number,
  height: number,
  x: number,
  y: number,
): boolean {
  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      const sampleX = x + offsetX;
      const sampleY = y + offsetY;
      if (
        sampleX < 0 ||
        sampleY < 0 ||
        sampleX >= width ||
        sampleY >= height
      ) {
        continue;
      }
      if (mask[sampleY * width + sampleX] === 1) {
        return true;
      }
    }
  }
  return false;
}

function isConnectorInsideGlyphMask(
  startPoint: TracingStrokePoint,
  endPoint: TracingStrokePoint,
  constraint: GlyphMaskConstraint | undefined,
): boolean {
  if (!constraint) return false;

  const startMaskPoint = mapSourcePointToMaskPixel(startPoint, constraint);
  const endMaskPoint = mapSourcePointToMaskPixel(endPoint, constraint);
  const deltaX = endMaskPoint.x - startMaskPoint.x;
  const deltaY = endMaskPoint.y - startMaskPoint.y;
  const steps = Math.max(Math.abs(deltaX), Math.abs(deltaY));
  if (steps === 0) return true;

  let filledSamples = 0;
  for (let stepIndex = 0; stepIndex <= steps; stepIndex += 1) {
    const sampleX = Math.round(startMaskPoint.x + (deltaX * stepIndex) / steps);
    const sampleY = Math.round(startMaskPoint.y + (deltaY * stepIndex) / steps);
    if (
      isMaskFilledNear(
        constraint.mask,
        constraint.width,
        constraint.height,
        sampleX,
        sampleY,
      )
    ) {
      filledSamples += 1;
    }
  }

  return filledSamples / (steps + 1) >= 0.92;
}

function mergeStrokePairToBestPath(
  firstStroke: GeneratedStrokeCandidate,
  secondStroke: GeneratedStrokeCandidate,
  maskConstraint?: GlyphMaskConstraint,
): { candidate: GeneratedStrokeCandidate; connectorDistance: number } | null {
  if (firstStroke.componentId !== secondStroke.componentId) {
    return null;
  }

  const firstVariants = [firstStroke.points, [...firstStroke.points].reverse()];
  const secondVariants = [
    secondStroke.points,
    [...secondStroke.points].reverse(),
  ];

  let bestPoints: TracingStrokePoint[] = [];
  let bestConnectorDistance = Number.POSITIVE_INFINITY;

  firstVariants.forEach((firstVariant) => {
    secondVariants.forEach((secondVariant) => {
      const firstThenSecond = mergeTwoStrokePointLists(
        firstVariant,
        secondVariant,
      );
      const firstThenSecondSafe =
        firstThenSecond.connectorDistance <=
          MAX_SAFE_MERGE_CONNECTOR_DISTANCE ||
        isConnectorInsideGlyphMask(
          firstVariant[firstVariant.length - 1],
          secondVariant[0],
          maskConstraint,
        );
      if (firstThenSecondSafe) {
        if (firstThenSecond.connectorDistance < bestConnectorDistance) {
          bestConnectorDistance = firstThenSecond.connectorDistance;
          bestPoints = firstThenSecond.points;
        }
      }

      const secondThenFirst = mergeTwoStrokePointLists(
        secondVariant,
        firstVariant,
      );
      const secondThenFirstSafe =
        secondThenFirst.connectorDistance <=
          MAX_SAFE_MERGE_CONNECTOR_DISTANCE ||
        isConnectorInsideGlyphMask(
          secondVariant[secondVariant.length - 1],
          firstVariant[0],
          maskConstraint,
        );
      if (secondThenFirstSafe) {
        if (secondThenFirst.connectorDistance < bestConnectorDistance) {
          bestConnectorDistance = secondThenFirst.connectorDistance;
          bestPoints = secondThenFirst.points;
        }
      }
    });
  });

  if (bestPoints.length === 0 || !Number.isFinite(bestConnectorDistance)) {
    return null;
  }

  return {
    candidate: createStrokeCandidate(
      bestPoints,
      firstStroke.componentId,
      firstStroke.hint ?? secondStroke.hint,
    ),
    connectorDistance: bestConnectorDistance,
  };
}

function mergeStrokeCandidatesToTargetCount(
  candidates: GeneratedStrokeCandidate[],
  targetCount: number,
  maskConstraint?: GlyphMaskConstraint,
): GeneratedStrokeCandidate[] {
  if (targetCount <= 0) return [];
  const working = [...candidates];

  while (working.length > targetCount) {
    let bestLeftIndex = -1;
    let bestRightIndex = -1;
    let bestMergedCandidate: GeneratedStrokeCandidate | null = null;
    let bestConnectionDistance = Number.POSITIVE_INFINITY;

    for (let leftIndex = 0; leftIndex < working.length - 1; leftIndex += 1) {
      for (
        let rightIndex = leftIndex + 1;
        rightIndex < working.length;
        rightIndex += 1
      ) {
        const mergeResult = mergeStrokePairToBestPath(
          working[leftIndex],
          working[rightIndex],
          maskConstraint,
        );
        if (!mergeResult) continue;
        const connectionDistance = mergeResult.connectorDistance;
        if (connectionDistance < bestConnectionDistance) {
          bestConnectionDistance = connectionDistance;
          bestLeftIndex = leftIndex;
          bestRightIndex = rightIndex;
          bestMergedCandidate = mergeResult.candidate;
        }
      }
    }

    if (bestLeftIndex === -1 || bestRightIndex === -1 || !bestMergedCandidate) {
      break;
    }

    working.splice(bestRightIndex, 1);
    working.splice(bestLeftIndex, 1, bestMergedCandidate);
  }

  return working;
}

function splitStrokeCandidateByMidpoint(
  candidate: GeneratedStrokeCandidate,
): [GeneratedStrokeCandidate, GeneratedStrokeCandidate] | null {
  const { points } = candidate;
  if (points.length < 4) return null;

  const cumulativeLengths: number[] = [0];
  for (let index = 1; index < points.length; index += 1) {
    cumulativeLengths[index] =
      cumulativeLengths[index - 1] +
      getStrokePointDistance(points[index - 1], points[index]);
  }

  const totalLength = cumulativeLengths[cumulativeLengths.length - 1];
  if (totalLength <= 1) return null;

  const halfLength = totalLength / 2;
  let splitIndex = 1;
  let minDelta = Number.POSITIVE_INFINITY;

  for (let index = 1; index < points.length - 1; index += 1) {
    const delta = Math.abs(cumulativeLengths[index] - halfLength);
    if (delta < minDelta) {
      minDelta = delta;
      splitIndex = index;
    }
  }

  if (splitIndex <= 0 || splitIndex >= points.length - 1) return null;

  const leftPoints = dedupeConsecutiveStrokePoints(
    points.slice(0, splitIndex + 1),
  );
  const rightPoints = dedupeConsecutiveStrokePoints(points.slice(splitIndex));
  if (leftPoints.length < 2 || rightPoints.length < 2) return null;

  return [
    createStrokeCandidate(leftPoints, candidate.componentId, candidate.hint),
    createStrokeCandidate(rightPoints, candidate.componentId),
  ];
}

function expandStrokeCandidatesToTargetCount(
  candidates: GeneratedStrokeCandidate[],
  targetCount: number,
): GeneratedStrokeCandidate[] {
  if (targetCount <= 0) return [];
  const working = [...candidates];

  while (working.length < targetCount) {
    let splitCandidateIndex = -1;
    let splitCandidateLength = 0;

    working.forEach((candidate, index) => {
      if (
        candidate.length > splitCandidateLength &&
        candidate.points.length >= 4
      ) {
        splitCandidateLength = candidate.length;
        splitCandidateIndex = index;
      }
    });

    if (splitCandidateIndex === -1) break;
    const splitResult = splitStrokeCandidateByMidpoint(
      working[splitCandidateIndex],
    );
    if (!splitResult) break;

    working.splice(splitCandidateIndex, 1, splitResult[0], splitResult[1]);
  }

  return working;
}

export function mapPauseAnchorsToPausePoints(
  points: TracingStrokePoint[],
  hint: TracingAutoStrokeHint | undefined,
): TracingPausePoint[] | undefined {
  if (!hint || points.length < 2) return undefined;

  const pauseByIndex = new Map<number, number | undefined>();
  hint.pausePoints?.forEach((pausePoint) => {
    const clampedIndex = Math.max(
      1,
      Math.min(points.length - 1, Math.round(pausePoint.pointIndex)),
    );
    pauseByIndex.set(clampedIndex, pausePoint.pauseMs);
  });

  hint.pauseAnchors?.forEach((pauseAnchor) => {
    let nearestIndex = 1;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
      const distance = getStrokePointDistance(
        points[pointIndex],
        pauseAnchor.point,
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = pointIndex;
      }
    }

    pauseByIndex.set(nearestIndex, pauseAnchor.pauseMs);
  });

  if (pauseByIndex.size === 0) return undefined;

  return [...pauseByIndex.entries()]
    .sort(([leftIndex], [rightIndex]) => leftIndex - rightIndex)
    .map(([pointIndex, pauseMs]) => ({
      pointIndex,
      pauseMs,
    }));
}

export function resolveAutoStrokeCandidates(
  targetText: string,
  candidates: GeneratedStrokeCandidate[],
  autoConfig:
    | { strokeCount?: number; strokeHints?: TracingAutoStrokeHint[] }
    | undefined,
  maskConstraint?: GlyphMaskConstraint,
): GeneratedStrokeCandidate[] {
  if (candidates.length === 0) return [];

  const strokeHints = autoConfig?.strokeHints ?? [];
  const singleLetterDefaultStrokeCount =
    [...targetText].length === 1 ? 1 : undefined;
  const targetStrokeCount =
    autoConfig?.strokeCount ??
    (strokeHints.length > 0
      ? strokeHints.length
      : singleLetterDefaultStrokeCount);
  let didNormalizeToTarget = true;

  let normalizedCandidates = [...candidates];
  if (targetStrokeCount && targetStrokeCount > 0) {
    const minimumStrokeCount = Math.max(
      targetStrokeCount,
      new Set(normalizedCandidates.map((candidate) => candidate.componentId))
        .size,
    );
    if (normalizedCandidates.length > targetStrokeCount) {
      normalizedCandidates = mergeStrokeCandidatesToTargetCount(
        normalizedCandidates,
        minimumStrokeCount,
        maskConstraint,
      );
    }
    if (normalizedCandidates.length < targetStrokeCount) {
      normalizedCandidates = expandStrokeCandidatesToTargetCount(
        normalizedCandidates,
        targetStrokeCount,
      );
    }
    didNormalizeToTarget = normalizedCandidates.length === minimumStrokeCount;
  }

  const remainingCandidates = [...normalizedCandidates];
  const hintedCandidates: GeneratedStrokeCandidate[] = [];

  strokeHints.forEach((hint) => {
    if (remainingCandidates.length === 0) return;
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    let shouldReverse = false;

    remainingCandidates.forEach((candidate, candidateIndex) => {
      const candidateScore = scoreCandidateForHint(candidate, hint);
      if (candidateScore.score < bestScore) {
        bestScore = candidateScore.score;
        bestIndex = candidateIndex;
        shouldReverse = candidateScore.shouldReverse;
      }
    });

    const selectedCandidate = remainingCandidates.splice(bestIndex, 1)[0];
    const selectedPoints = shouldReverse
      ? [...selectedCandidate.points].reverse()
      : selectedCandidate.points;
    hintedCandidates.push(
      createStrokeCandidate(
        selectedPoints,
        selectedCandidate.componentId,
        hint,
      ),
    );
  });

  // Sort by length descending to prioritize main strokes if we must chop
  remainingCandidates.sort(
    (leftCandidate, rightCandidate) =>
      rightCandidate.length - leftCandidate.length,
  );

  if (!targetStrokeCount || targetStrokeCount <= 0) {
    return [...hintedCandidates, ...remainingCandidates];
  }

  if (!didNormalizeToTarget) {
    return [...hintedCandidates, ...remainingCandidates];
  }

  if (hintedCandidates.length >= targetStrokeCount) {
    return hintedCandidates.slice(0, targetStrokeCount);
  }

  return [
    ...hintedCandidates,
    ...remainingCandidates.slice(
      0,
      targetStrokeCount - hintedCandidates.length,
    ),
  ];
}
