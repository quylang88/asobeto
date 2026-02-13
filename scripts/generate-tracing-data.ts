import fs from "fs";
import path from "path";
import opentype from "opentype.js";
// @ts-ignore
import wawoff2 from "wawoff2";
import {
  skeletonizeBinaryMask,
  extractConnectedComponents,
  buildCenterlineTrailsForComponent,
  createStrokeCandidateFromPixelPath,
  resolveAutoStrokeCandidates,
  mapPauseAnchorsToPausePoints,
  createTracingGridMetrics,
  type GeneratedStrokeCandidate,
} from "../src/lib/tracing-algorithm";

const OUTPUT_DIR = path.resolve(__dirname, "../src/data/tracing/letters");
// Use Bold font for tracing generation to ensure solid shapes (normal might be dashed/dotted)
const FONT_PATH = path.resolve(__dirname, "../public/fonts/HP001_4_hang_bold.woff2");

// Standard grid constants from the app
const BASE_CANVAS_SIZE = 280;

// List of 29 Vietnamese letters
const LETTERS = [
  "a", "ă", "â", "b", "c", "d", "đ", "e", "ê", "g", "h", "i", "k", "l", "m",
  "n", "o", "ô", "ơ", "p", "q", "r", "s", "t", "u", "ư", "v", "x", "y"
];

async function generateLetterData() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load font
  const fontBuffer = fs.readFileSync(FONT_PATH);
  const decompressedBuffer = await wawoff2.decompress(fontBuffer);
  const buffer = decompressedBuffer.buffer.slice(
    decompressedBuffer.byteOffset,
    decompressedBuffer.byteOffset + decompressedBuffer.byteLength
  );
  const font = opentype.parse(buffer);

  for (const letter of LETTERS) {
    console.log(`Processing letter: ${letter}`);

    try {
      const data = processLetter(letter, font);
      const filePath = path.join(OUTPUT_DIR, `${letter}.ts`);
      fs.writeFileSync(filePath, data);
      console.log(`Generated ${filePath}`);
    } catch (error) {
      console.error(`Error processing ${letter}:`, error);
    }
  }
}

function processLetter(letter: string, font: opentype.Font): string {
  // 1. Calculate Metrics & Grid
  const renderFontSize = 400; // Arbitrary large size for high res metric check
  const pathObj = font.getPath(letter, 0, 0, renderFontSize);

  // Detect ascender/descender
  const fontUnitsPerEm = font.unitsPerEm;
  const ascender = font.ascender;
  const descender = font.descender;

  const letterBbox = pathObj.getBoundingBox();
  const letterTop = letterBbox.y2;
  const letterBottom = letterBbox.y1;

  const isTall = letterTop > (ascender * 0.85);
  const isDeep = letterBottom < (descender * 0.5);

  let rows = 4;
  if (isDeep) {
      rows = 5;
  } else if (isTall && (letterTop - letterBottom) > (fontUnitsPerEm * 0.8)) {
     rows = 5;
  }

  const initialMetrics = createTracingGridMetrics({ rows, columns: 3 });

  // Calculate positioning variables for rendering
  const sizeScale = 2;
  // Calculate fontSize based on BASE metrics (like app does) to keep consistency
  const baseGuideFontSize = Math.round(Math.min(initialMetrics.drawAreaWidth, BASE_CANVAS_SIZE) * 0.48);
  const realFontSize = Math.max(12, Math.round(baseGuideFontSize * sizeScale));

  const scale = 1 / font.unitsPerEm * realFontSize;
  const ascent = font.ascender * scale;

  // Determine best baselineY and rows
  // We want to fit y2*scale (top) and y1*scale (bottom) relative to baseline.
  // bbox y2 is max (top in font coords), y1 is min (bottom in font coords).
  // In Canvas (Y down):
  // Top pixel = baselineY - y2 * scale.
  // Bottom pixel = baselineY - y1 * scale.

  // Grid candidates (Y pixel values for lines)
  // For rows=4 (280px draw area): Lines at 0, 70, 140, 210, 280.
  // We prefer line 3 (210) or line 4 (280).
  const margin = initialMetrics.margin;

  const tryFit = (r: number) => {
      const h = r * 70 + margin * 2;
      const candidates = [
          margin + 210, // Line 3
          margin + 280, // Line 4
          margin + 140, // Line 2 (rare)
      ];
      if (r >= 5) candidates.push(margin + 350); // Line 5

      for (const bY of candidates) {
          const topY = bY - letterTop * scale;
          const botY = bY - letterBottom * scale;
          if (topY >= margin && botY <= h - margin) {
              return { rows: r, baselineY: bY };
          }
      }
      return null;
  };

  let fit = tryFit(4);
  if (!fit) fit = tryFit(5);
  if (!fit) fit = tryFit(6);
  // Fallback
  if (!fit) fit = { rows: 5, baselineY: margin + 280 };

  rows = fit.rows;
  const baselineY = fit.baselineY;

  // Recalculate metrics for final canvas
  const finalMetrics = createTracingGridMetrics({ rows, columns: 3 });

  // Back-calculate glyphY for config
  // baselineY = margin + (glyphY / 280) * drawAreaHeight + ascent
  // baselineY - ascent - margin = (glyphY / 280) * drawAreaHeight
  // glyphY = ((baselineY - ascent - margin) / drawAreaHeight) * 280
  const drawAreaHeight = finalMetrics.drawAreaHeight;
  const calculatedGlyphY = ((baselineY - ascent - margin) / drawAreaHeight) * BASE_CANVAS_SIZE;

  const centerX = finalMetrics.canvasWidth / 2;
  const advanceWidth = font.getAdvanceWidth(letter, realFontSize);

  // Get the path at origin
  // Note: opentype.js getPath with fontSize returns Y-up coordinates (Cartesian) if not drawing to canvas context?
  // Actually, usually it returns standard font coords scaled.
  // Standard font: Y is up.
  // We want to draw to mask where Y is down.
  // So we need to flip Y. y_screen = baselineY - y_font.
  // But getPath(x, y) adds x, y to coordinates.
  // If we pass 0,0, we get raw scaled coords.
  const rawPath = font.getPath(letter, 0, 0, realFontSize);

  // Transform commands manually to screen coordinates (Flip Y)
  const dx = centerX - advanceWidth / 2;
  const dy = baselineY; // Baseline position

  rawPath.commands.forEach(cmd => {
      if ('x' in cmd) cmd.x = dx + cmd.x;
      if ('y' in cmd) cmd.y = dy - cmd.y; // Flip Y: up in font -> up (smaller Y) in screen
      if ('x1' in cmd) cmd.x1 = dx + cmd.x1;
      if ('y1' in cmd) cmd.y1 = dy - cmd.y1;
      if ('x2' in cmd) cmd.x2 = dx + cmd.x2;
      if ('y2' in cmd) cmd.y2 = dy - cmd.y2;
  });

  const glyphY = Math.round(calculatedGlyphY);

  // 2. Rasterize & Skeletonize
  const mask = rasterizePathToMask(rawPath, finalMetrics.canvasWidth, finalMetrics.canvasHeight);
  const pixelCount = mask.reduce((acc, val) => acc + val, 0);
  console.log(`Letter ${letter}: Mask pixels: ${pixelCount}`);

  const skeleton = skeletonizeBinaryMask(mask, finalMetrics.canvasWidth, finalMetrics.canvasHeight);
  const skeletonPixels = skeleton.reduce((acc, val) => acc + val, 0);
  console.log(`Letter ${letter}: Skeleton pixels: ${skeletonPixels}`);

  // 3. Vectorize
  const components = extractConnectedComponents(skeleton, finalMetrics.canvasWidth, finalMetrics.canvasHeight);

  const candidates: GeneratedStrokeCandidate[] = [];
  components.forEach((compPixels, componentId) => {
      const compTrails = buildCenterlineTrailsForComponent(compPixels, finalMetrics.canvasWidth, finalMetrics.canvasHeight, mask.length);
      compTrails.forEach(trail => {
          const candidate = createStrokeCandidateFromPixelPath(trail, finalMetrics.canvasWidth, finalMetrics, componentId);
          if (candidate) candidates.push(candidate);
      });
  });

  if (letter === "b" || letter === "g") {
      console.log(`Letter ${letter}: Found ${candidates.length} candidates.`);
      candidates.forEach((c, i) => console.log(`  Candidate ${i}: length ${c.length}, points ${c.points.length}`));
  }

  // Filter and Resolve (Order and Direction)
  const resolvedCandidates = resolveAutoStrokeCandidates(letter, candidates, undefined);

  // Convert to final stroke format
  const strokePaths = resolvedCandidates.map(c => ({
      points: c.points,
      durationMs: 1200,
      pausePoints: mapPauseAnchorsToPausePoints(c.points, undefined) || [],
  }));

  // 4. Generate File Content
  const fileContent = `import { type LetterStrokeAnimation } from "../types";

export const letterStroke${letter.toUpperCase()}: LetterStrokeAnimation = {
  letter: "${letter}",
  layout: {
    columns: ${finalMetrics.columns},
    rows: ${finalMetrics.rows},
  },
  glyph: {
    x: 30, // Default horizontal
    y: ${glyphY},
    sizeScale: ${sizeScale},
  },
  demo: {
    strategy: "auto",
    auto: {
      strokeCount: ${strokePaths.length},
      strokeHints: [
        ${strokePaths.map((_, i) => `// Stroke ${i + 1}`).join("\n        ")}
      ],
    },
    strokes: ${JSON.stringify(strokePaths, null, 2).replace(/"x":/g, "x:").replace(/"y":/g, "y:")}
  },
};
`;

  return fileContent;
}

// Pure JS Rasterizer
function rasterizePathToMask(path: opentype.Path, width: number, height: number): Uint8Array {
  const mask = new Uint8Array(width * height);
  // We use a simple scanline approach.
  // 1. Convert commands to polygons
  const polygons: Array<Array<{x: number, y: number}>> = [];
  let currentPoly: Array<{x: number, y: number}> = [];
  let startPoint = { x: 0, y: 0 };
  let currentPoint = { x: 0, y: 0 };

  path.commands.forEach(cmd => {
    switch (cmd.type) {
      case 'M':
        if (currentPoly.length > 0) polygons.push(currentPoly);
        currentPoly = [{ x: cmd.x, y: cmd.y }];
        startPoint = { x: cmd.x, y: cmd.y };
        currentPoint = { x: cmd.x, y: cmd.y };
        break;
      case 'L':
        currentPoly.push({ x: cmd.x, y: cmd.y });
        currentPoint = { x: cmd.x, y: cmd.y };
        break;
      case 'Q':
      case 'C':
        // Flatten curves
        const curves = flattenCurve(cmd, currentPoint);
        curves.forEach(p => currentPoly.push(p));
        currentPoint = curves[curves.length - 1];
        break;
      case 'Z':
        if (currentPoly.length > 0) {
           // Close loop if needed
           if (currentPoint.x !== startPoint.x || currentPoint.y !== startPoint.y) {
               currentPoly.push(startPoint);
           }
           polygons.push(currentPoly);
           currentPoly = [];
        }
        break;
    }
  });
  if (currentPoly.length > 0) polygons.push(currentPoly);

  // 2. Scanline Rasterization
  for (let y = 0; y < height; y++) {
    const intersections: number[] = [];
    for (const poly of polygons) {
      for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];

        // Check intersection with horizontal line at y
        if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
           // Calculate x intersection
           const t = (y - p1.y) / (p2.y - p1.y);
           const x = p1.x + t * (p2.x - p1.x);
           intersections.push(x);
        }
      }
    }

    intersections.sort((a, b) => a - b);

    // Fill pixels between pairs
    for (let i = 0; i < intersections.length; i += 2) {
      if (i + 1 >= intersections.length) break;
      const xStart = Math.ceil(intersections[i]);
      const xEnd = Math.floor(intersections[i + 1]);
      for (let x = xStart; x <= xEnd; x++) {
        if (x >= 0 && x < width) {
          mask[y * width + x] = 1;
        }
      }
    }
  }

  return mask;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenCurve(cmd: any, start: {x: number, y: number}): Array<{x: number, y: number}> {
    // Simple sampling for now
    const points: Array<{x: number, y: number}> = [];
    const steps = 50;
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        if (cmd.type === 'Q') {
            const x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * cmd.x1 + t * t * cmd.x;
            const y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * cmd.y1 + t * t * cmd.y;
            points.push({x, y});
        } else if (cmd.type === 'C') {
             const x = (1 - t) * (1 - t) * (1 - t) * start.x + 3 * (1 - t) * (1 - t) * t * cmd.x1 + 3 * (1 - t) * t * t * cmd.x2 + t * t * t * cmd.x;
             const y = (1 - t) * (1 - t) * (1 - t) * start.y + 3 * (1 - t) * (1 - t) * t * cmd.y1 + 3 * (1 - t) * t * t * cmd.y2 + t * t * t * cmd.y;
             points.push({x, y});
        }
    }
    return points;
}

generateLetterData().catch(console.error);
