"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { PrimaryButton } from "@/components/common/primary-button";
import { createTracingGridMetrics } from "@/data/tracing/utils";
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

  // Tool State
  const [toolMode, setToolMode] = useState<"snap" | "free">("snap");
  const [isDrawingFree, setIsDrawingFree] = useState(false);

  // Config States
  const [columns, setColumns] = useState(3);
  const [rows, setRows] = useState(4);
  const [glyphX, setGlyphX] = useState(30);
  const [glyphY, setGlyphY] = useState(136);
  const [glyphScale, setGlyphScale] = useState(2);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate grid metrics based on user config
  const metrics = useMemo<TracingGridMetrics>(() => {
    return createTracingGridMetrics({
      columns,
      rows,
    });
  }, [columns, rows]);

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
      const binaryMask = createGlyphBinaryMask(targetText, metrics, fontSize, {
        x: glyphX,
        y: glyphY,
        sizeScale: glyphScale,
      });
      if (!binaryMask) {
        setSkeletonData(null);
        return;
      }

      const { width, height, mask } = binaryMask;
      const skeletonMask = skeletonizeBinaryMask(mask, width, height);
      // Use smaller minPixels to catch dots/accents
      const components = extractConnectedComponents(
        skeletonMask,
        width,
        height,
        5,
      );

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
  }, [targetText, metrics, fontSize, glyphX, glyphY, glyphScale]);

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
      { x: glyphX, y: glyphY, sizeScale: glyphScale },
      false,
    );

    // 2. Draw Finished Strokes (Blue)
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#3b82f6"; // Blue 500

    strokes.forEach((stroke) => {
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
      currentStroke.forEach((pt) => {
        const p = mapSourcePointToCanvas(pt, metrics);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [
    targetText,
    strokes,
    currentStroke,
    metrics,
    fontSize,
    skeletonData,
    glyphX,
    glyphY,
    glyphScale,
  ]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Free Mode: Start drawing immediately
    if (toolMode === "free") {
      setIsDrawingFree(true);
      const sourcePoint = mapCanvasPointToSource({ x, y }, metrics);
      setCurrentStroke((prev) => [...prev, sourcePoint]);
      return;
    }

    // Snap Mode Logic
    if (!skeletonData) return;

    const allPixels = skeletonData.components.flat();
    const nearestPixelIndex = findNearestComponentPixel(
      allPixels,
      skeletonData.width,
      Math.round(x),
      Math.round(y),
    );

    if (nearestPixelIndex === null) return;

    const pixelX = nearestPixelIndex % skeletonData.width;
    const pixelY = Math.floor(nearestPixelIndex / skeletonData.width);
    const sourcePoint = mapCanvasPointToSource(
      { x: pixelX, y: pixelY },
      metrics,
    );

    if (currentStroke.length === 0) {
      setCurrentStroke([sourcePoint]);
    } else {
      const lastPoint = currentStroke[currentStroke.length - 1];
      const lastPixelMap = mapSourcePointToCanvas(lastPoint, metrics);
      const lastPixelIndex = findNearestComponentPixel(
        allPixels,
        skeletonData.width,
        Math.round(lastPixelMap.x),
        Math.round(lastPixelMap.y),
      );

      if (lastPixelIndex !== null) {
        const pathPixels = findShortestPixelPath(
          skeletonData.adjacency,
          lastPixelIndex,
          nearestPixelIndex,
        );

        if (pathPixels && pathPixels.length > 0) {
          const smoothPath = simplifyTrailToSourcePoints(
            pathPixels,
            skeletonData.width,
            metrics,
          );
          const newPoints = smoothPath.slice(1);
          setCurrentStroke((prev) => [...prev, ...newPoints]);
        } else {
          setCurrentStroke((prev) => [...prev, sourcePoint]);
        }
      } else {
        setCurrentStroke((prev) => [...prev, sourcePoint]);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (toolMode !== "free" || !isDrawingFree || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const sourcePoint = mapCanvasPointToSource({ x, y }, metrics);

    // Add point if far enough from last point to avoid density
    const lastPoint = currentStroke[currentStroke.length - 1];
    if (lastPoint) {
      const dist = Math.sqrt(
        Math.pow(sourcePoint.x - lastPoint.x, 2) +
          Math.pow(sourcePoint.y - lastPoint.y, 2),
      );
      if (dist < 1.0) return; // Min distance threshold
    }

    setCurrentStroke((prev) => [...prev, sourcePoint]);
  };

  const handlePointerUp = () => {
    if (toolMode === "free") {
      setIsDrawingFree(false);
    }
  };

  const finishStroke = () => {
    if (currentStroke.length < 2) return;
    setStrokes((prev) => [...prev, { points: currentStroke }]);
    setCurrentStroke([]);
  };

  const undoLastPoint = () => {
    if (currentStroke.length > 0) {
      setCurrentStroke((prev) => {
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
        columns,
        rows,
      },
      glyph: {
        x: glyphX,
        y: glyphY,
        sizeScale: glyphScale,
      },
      demo: {
        strategy: "manual",
        pauseMs: 800,
        strokes: strokes.map((s) => ({
          points: s.points.map((p) => ({
            x: Number(p.x.toFixed(1)),
            y: Number(p.y.toFixed(1)),
          })),
        })),
      },
    };

    const json = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(json);
    alert("JSON copied to clipboard!");
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-slate-50 p-6 font-sans">
      <h1 className="text-2xl font-bold mb-4 text-slate-800">
        Stroke Builder Tool
      </h1>

      <div className="mb-6 flex flex-wrap gap-6 items-start justify-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase">
            Text
          </label>
          <input
            value={targetText}
            onChange={(e) => setTargetText(e.target.value)}
            className="border-2 border-slate-300 rounded px-4 py-2 text-xl w-32 text-center font-hp-special"
            placeholder="Text"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase">
            Grid Layout
          </label>
          <div className="flex gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Cols</span>
              <input
                type="number"
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value))}
                className="w-16 border rounded px-2 py-1"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Rows</span>
              <input
                type="number"
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="w-16 border rounded px-2 py-1"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase">
            Glyph Position
          </label>
          <div className="flex gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">X</span>
              <input
                type="number"
                value={glyphX}
                onChange={(e) => setGlyphX(Number(e.target.value))}
                className="w-16 border rounded px-2 py-1"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Y</span>
              <input
                type="number"
                value={glyphY}
                onChange={(e) => setGlyphY(Number(e.target.value))}
                className="w-16 border rounded px-2 py-1"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Scale</span>
              <input
                type="number"
                step="0.1"
                value={glyphScale}
                onChange={(e) => setGlyphScale(Number(e.target.value))}
                className="w-16 border rounded px-2 py-1"
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative border-2 border-slate-200 bg-white shadow-lg rounded-xl overflow-hidden mb-6"
        style={{ width: metrics.canvasWidth, height: metrics.canvasHeight }}
      >
        <canvas
          ref={canvasRef}
          width={metrics.canvasWidth}
          height={metrics.canvasHeight}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="cursor-crosshair w-full h-full touch-none"
        />
        <div className="absolute top-2 left-2 text-xs text-slate-400 pointer-events-none">
          {skeletonData ? "Skeleton Ready" : "Generating..."}
        </div>
      </div>

      <div className="mb-4 flex gap-4 bg-slate-100 p-2 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="toolMode"
            value="snap"
            checked={toolMode === "snap"}
            onChange={() => setToolMode("snap")}
            className="w-4 h-4 text-blue-600"
          />
          <span className="font-bold text-slate-700">Snap Mode</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="toolMode"
            value="free"
            checked={toolMode === "free"}
            onChange={() => setToolMode("free")}
            className="w-4 h-4 text-purple-600"
          />
          <span className="font-bold text-slate-700">Freehand Mode</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
        <PrimaryButton
          onClick={finishStroke}
          disabled={currentStroke.length < 2}
          tone="success"
          className="px-4 py-2"
        >
          Finish Stroke
        </PrimaryButton>
        <PrimaryButton
          onClick={undoLastPoint}
          disabled={currentStroke.length === 0}
          tone="neutral"
          className="px-4 py-2"
        >
          Undo Point
        </PrimaryButton>
        <PrimaryButton
          onClick={() => setCurrentStroke([])}
          disabled={currentStroke.length === 0}
          tone="danger"
          className="px-4 py-2"
        >
          Cancel Stroke
        </PrimaryButton>
        <div className="w-px h-8 bg-slate-300 mx-2"></div>
        <PrimaryButton
          onClick={clearAll}
          disabled={strokes.length === 0}
          tone="danger"
          className="px-4 py-2"
        >
          Reset All
        </PrimaryButton>
        <PrimaryButton
          onClick={exportJSON}
          disabled={strokes.length === 0}
          tone="brand"
          className="px-6 py-2"
        >
          Copy JSON
        </PrimaryButton>
      </div>

      <div className="mt-8 w-full max-w-2xl bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto h-64 text-sm font-mono">
        <pre>
          {JSON.stringify(
            {
              letter: targetText,
              strokes: strokes.length,
            },
            null,
            2,
          )}
        </pre>
        <p className="mt-2 text-slate-400 italic">
          Click &quot;Copy JSON&quot; to get the full configuration.
        </p>
      </div>

      <div className="mt-4 text-slate-500 text-sm max-w-md text-center">
        <p>Instructions:</p>
        <ul className="list-disc text-left pl-6 mt-2 space-y-1">
          <li>Type a letter above.</li>
          <li>Adjust Grid Layout and Glyph Position to fit your needs.</li>
          <li>Click on the letter to set &quot;Key Points&quot;.</li>
          <li>
            The tool automatically snaps the path to the font&apos;s center line.
          </li>
          <li>Click &quot;Finish Stroke&quot; when done with one stroke.</li>
          <li>Repeat for next strokes.</li>
          <li>Copy JSON and paste into your data file.</li>
        </ul>
      </div>
    </div>
  );
}
