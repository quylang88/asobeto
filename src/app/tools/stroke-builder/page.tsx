"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { PrimaryButton } from "@/components/common/primary-button";
import {
  createTracingGridMetrics,
  DEFAULT_WRITING_GRID_CELL_SIZE,
  LETTER_TRACING_CANVAS_WIDTH,
  LETTER_TRACING_CANVAS_HEIGHT,
  SOURCE_CANVAS_SIZE,
} from "@/data/tracing/tracing-utils";
import {
  type TracingGridMetrics,
  type TracingStrokePoint,
  type TracingStrokePath,
} from "@/data/tracing/types";
import {
  createGlyphBinaryMask,
  skeletonizeBinaryMask,
  extractConnectedComponents,
  buildComponentAdjacency,
  findNearestComponentPixel,
  findShortestPixelPath,
  simplifyTrailToSourcePoints,
  mapSourcePointToCanvas,
  mapCanvasPointToSource,
  drawGuideGlyph,
  getDistanceBetweenPoints,
} from "@/lib/tracing-algo";

// Define a type for internal Skeleton usage
interface SkeletonData {
  mask: Uint8Array;
  width: number;
  height: number;
  components: number[][];
  adjacency: Map<number, number[]>;
}

export default function StrokeBuilderTool() {
  const [targetText, setTargetText] = useState("a");
  const [strokes, setStrokes] = useState<TracingStrokePath[]>([]);
  const [currentStroke, setCurrentStroke] = useState<TracingStrokePoint[]>([]);
  const [skeletonData, setSkeletonData] = useState<SkeletonData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate grid metrics based on text length (similar to game logic)
  const metrics = useMemo<TracingGridMetrics>(() => {
    const isSingle = [...targetText].length === 1;
    // For single letters, assume standard 3x4 grid
    // For words, we might need more columns, but let's stick to standard for now.
    // The tool should primarily target single letters or short words.
    return createTracingGridMetrics();
  }, [targetText]);

  // Compute font size (similar logic to game)
  const fontSize = useMemo(() => {
    const len = [...targetText].length;
    const baseSize = Math.min(metrics.drawAreaWidth, metrics.drawAreaHeight);
    if (len <= 1) return Math.round(baseSize * 0.84);
    if (len === 2) return Math.round(baseSize * 0.72);
    if (len <= 4) return Math.round(baseSize * 0.58);
    return Math.round(baseSize * 0.48);
  }, [targetText, metrics]);

  // Generate Skeleton on text change
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Ensure font is loaded
    document.fonts.ready.then(() => {
      const binaryMask = createGlyphBinaryMask(targetText, metrics, fontSize, { x: 30, y: 136, sizeScale: 2 });
      if (!binaryMask) {
        setSkeletonData(null);
        return;
      }

      const { width, height, mask } = binaryMask;
      const skeletonMask = skeletonizeBinaryMask(mask, width, height);
      // Use smaller minPixels to catch dots/accents
      const components = extractConnectedComponents(skeletonMask, width, height, 5);

      // Combine all components into one adjacency map for pathfinding across the whole glyph
      // Note: If components are disconnected, pathfinding will fail between them, which is correct.
      const allPixels = components.flat();
      const adjacency = buildComponentAdjacency(allPixels, width, height);

      setSkeletonData({
        mask: skeletonMask,
        width,
        height,
        components,
        adjacency,
      });

      // Clear strokes when text changes
      setStrokes([]);
      setCurrentStroke([]);
    });
  }, [targetText, metrics, fontSize]);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, metrics.canvasWidth, metrics.canvasHeight);

    // 1. Draw Glyph Background (Light Gray)
    drawGuideGlyph(
      ctx,
      targetText,
      metrics,
      fontSize,
      "rgba(0, 0, 0, 0.1)",
      { x: 30, y: 136, sizeScale: 2 },
      false
    );

    // 2. Draw Finished Strokes (Blue)
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#3b82f6"; // Blue 500

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      const start = mapSourcePointToCanvas(stroke.points[0], metrics);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = mapSourcePointToCanvas(stroke.points[i], metrics);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    });

    // 3. Draw Current Stroke (Red)
    if (currentStroke.length > 0) {
      ctx.strokeStyle = "#ef4444"; // Red 500
      ctx.beginPath();
      const start = mapSourcePointToCanvas(currentStroke[0], metrics);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < currentStroke.length; i++) {
        const p = mapSourcePointToCanvas(currentStroke[i], metrics);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();

      // Draw points as dots
      ctx.fillStyle = "#ef4444";
      currentStroke.forEach(pt => {
        const p = mapSourcePointToCanvas(pt, metrics);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 4. (Optional) Draw Skeleton for Debug
    /*
    if (skeletonData) {
      const { mask, width } = skeletonData;
      ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === 1) {
          ctx.fillRect(i % width, Math.floor(i / width), 1, 1);
        }
      }
    }
    */

  }, [targetText, strokes, currentStroke, metrics, fontSize, skeletonData]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!skeletonData || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Map to Source Coordinates (0-280) then to Mask Pixels
    // We need to find the nearest pixel on the SKELETON, not just any pixel.
    // mapSourcePointToCanvas is inverse of mapCanvasPointToSource

    // 1. Convert click to Canvas Space (which is 1:1 with rect if no scaling)
    // Actually our metrics handle margins.
    // The skeleton mask corresponds to the CANVAS size (including margins).

    const clickX = x; // Canvas Space
    const clickY = y; // Canvas Space

    // Find nearest skeleton pixel to this click
    // The mask is size [metrics.canvasWidth x metrics.canvasHeight] (approx)
    // We can search the component pixels.

    const allPixels = skeletonData.components.flat();
    const nearestPixelIndex = findNearestComponentPixel(
      allPixels,
      skeletonData.width,
      Math.round(clickX),
      Math.round(clickY)
    );

    if (nearestPixelIndex === null) return;

    // Convert nearest pixel back to Source Point
    const pixelX = nearestPixelIndex % skeletonData.width;
    const pixelY = Math.floor(nearestPixelIndex / skeletonData.width);

    // Convert Pixel (Canvas Space) -> Source Point
    const sourcePoint = mapCanvasPointToSource({ x: pixelX, y: pixelY }, metrics);

    // Pathfinding Logic
    if (currentStroke.length === 0) {
      // First point of stroke
      setCurrentStroke([sourcePoint]);
    } else {
      // Connect last point to new point
      const lastPoint = currentStroke[currentStroke.length - 1];

      // We need pixel indices for pathfinding
      // Convert lastPoint (Source) -> Pixel
      // Since lastPoint came from this same logic, it should align with a pixel roughly.
      // But let's re-map to be safe.
      const lastPixelMap = mapSourcePointToCanvas(lastPoint, metrics);
      const lastPixelIndex = findNearestComponentPixel(
        allPixels,
        skeletonData.width,
        Math.round(lastPixelMap.x),
        Math.round(lastPixelMap.y)
      );

      if (lastPixelIndex !== null) {
        // Find path
        const pathPixels = findShortestPixelPath(
          skeletonData.adjacency,
          lastPixelIndex,
          nearestPixelIndex
        );

        if (pathPixels && pathPixels.length > 0) {
          // Convert path pixels to smooth source points
          const smoothPath = simplifyTrailToSourcePoints(pathPixels, skeletonData.width, metrics);

          // Append to current stroke (excluding first point if it duplicates)
          // simplifyTrailToSourcePoints returns [start, ..., end]
          // We want to append [1...end]

          // Note: simplifyTrailToSourcePoints might return slightly different start point due to smoothing.
          // Let's just append all and let the next click continue.
          // Actually, we should probably just replace the currentStroke with [...old, ...new]

          // Better: The user is building ONE continuous stroke segment by segment.
          // So we append the new segment to the end.
          // But `smoothPath` includes the start point (which is roughly `lastPoint`).

          const newPoints = smoothPath.slice(1); // Remove start point to avoid duplicate/near-duplicate
          setCurrentStroke(prev => [...prev, ...newPoints]);
        } else {
          // No path found (e.g. gap in skeleton). Just add the point directly (straight line).
          setCurrentStroke(prev => [...prev, sourcePoint]);
        }
      } else {
        // Should not happen if lastPoint was valid
         setCurrentStroke(prev => [...prev, sourcePoint]);
      }
    }
  };

  const finishStroke = () => {
    if (currentStroke.length < 2) return;
    setStrokes(prev => [...prev, { points: currentStroke }]);
    setCurrentStroke([]);
  };

  const undoLastPoint = () => {
    // If building a stroke, remove last segment?
    // Hard to define "segment" once merged.
    // Let's just pop the last point.
    if (currentStroke.length > 0) {
      setCurrentStroke(prev => {
        const newStroke = [...prev];
        newStroke.pop();
        return newStroke;
      });
    }
  };

  const clearAll = () => {
    setStrokes([]);
    setCurrentStroke([]);
  };

  const exportJSON = () => {
    const data = {
      letter: targetText,
      layout: {
        columns: 3,
        rows: 4
      },
      glyph: {
        x: 30,
        y: 136,
        sizeScale: 2
      },
      demo: {
        strategy: "manual", // Manual because we generated it
        pauseMs: 800,
        strokes: strokes.map(s => ({
          points: s.points.map(p => ({
            x: Number(p.x.toFixed(1)),
            y: Number(p.y.toFixed(1))
          }))
        }))
      }
    };

    const json = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(json);
    alert("JSON copied to clipboard!");
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-50 p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4 text-slate-800">Stroke Builder Tool</h1>

      <div className="mb-6 flex gap-4">
        <input
          value={targetText}
          onChange={(e) => setTargetText(e.target.value)}
          className="border-2 border-slate-300 rounded px-4 py-2 text-xl w-32 text-center"
          placeholder="Text"
        />
      </div>

      <div className="relative border-2 border-slate-200 bg-white shadow-lg rounded-xl overflow-hidden mb-6"
           style={{ width: metrics.canvasWidth, height: metrics.canvasHeight }}>
        <canvas
          ref={canvasRef}
          width={metrics.canvasWidth}
          height={metrics.canvasHeight}
          onClick={handleCanvasClick}
          className="cursor-crosshair w-full h-full"
        />
        <div className="absolute top-2 left-2 text-xs text-slate-400 pointer-events-none">
          {skeletonData ? "Skeleton Ready" : "Generating..."}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
        <PrimaryButton onClick={finishStroke} disabled={currentStroke.length < 2} tone="success" className="px-4 py-2">
          Finish Stroke
        </PrimaryButton>
        <PrimaryButton onClick={undoLastPoint} disabled={currentStroke.length === 0} tone="neutral" className="px-4 py-2">
          Undo Point
        </PrimaryButton>
        <PrimaryButton onClick={() => setCurrentStroke([])} disabled={currentStroke.length === 0} tone="danger" className="px-4 py-2">
          Cancel Stroke
        </PrimaryButton>
        <PrimaryButton onClick={clearAll} disabled={strokes.length === 0} tone="danger" className="px-4 py-2">
          Clear All
        </PrimaryButton>
        <PrimaryButton onClick={exportJSON} disabled={strokes.length === 0} tone="brand" className="px-6 py-2">
          Copy JSON
        </PrimaryButton>
      </div>

      <div className="mt-8 w-full max-w-2xl bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto h-64 text-sm font-mono">
        <pre>
          {JSON.stringify({
            letter: targetText,
            strokes: strokes.length
          }, null, 2)}
        </pre>
        <p className="mt-2 text-slate-400 italic">Click "Copy JSON" to get the full configuration.</p>
      </div>

      <div className="mt-4 text-slate-500 text-sm max-w-md text-center">
        <p>Instructions:</p>
        <ul className="list-disc text-left pl-6 mt-2 space-y-1">
          <li>Type a letter above.</li>
          <li>Click on the letter to set "Key Points".</li>
          <li>The tool automatically snaps the path to the font's center line.</li>
          <li>Click "Finish Stroke" when done with one stroke.</li>
          <li>Repeat for next strokes.</li>
          <li>Copy JSON and paste into your data file.</li>
        </ul>
      </div>
    </div>
  );
}
