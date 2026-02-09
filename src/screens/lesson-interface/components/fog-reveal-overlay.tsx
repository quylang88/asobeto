"use client";

import { type PointerEvent, useEffect, useRef, useState } from "react";
import { FOG_ERASE_RADIUS } from "../constants";

interface FogRevealOverlayProps {
  revealKey: string;
  width: number;
  height: number;
  roundedClassName?: string;
}

export function FogRevealOverlay({
  revealKey,
  width,
  height,
  roundedClassName = "rounded-md",
}: FogRevealOverlayProps) {
  const fogCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isErasingFog, setIsErasingFog] = useState(false);

  // Vẽ lớp sương mờ mới mỗi khi đổi lesson để bé cào/xóa lại từ đầu.
  useEffect(() => {
    const fogCanvas = fogCanvasRef.current;
    if (!fogCanvas) return;

    const ratio = window.devicePixelRatio || 1;
    fogCanvas.width = Math.floor(width * ratio);
    fogCanvas.height = Math.floor(height * ratio);
    fogCanvas.style.width = `${width}px`;
    fogCanvas.style.height = `${height}px`;

    const fogCtx = fogCanvas.getContext("2d");
    if (!fogCtx) return;
    fogCtx.setTransform(1, 0, 0, 1, 0, 0);
    fogCtx.scale(ratio, ratio);
    fogCtx.clearRect(0, 0, width, height);

    const fogGradient = fogCtx.createLinearGradient(0, 0, width, height);
    fogGradient.addColorStop(0, "rgba(217, 240, 223, 1)");
    fogGradient.addColorStop(1, "rgba(188, 224, 199, 1)");
    fogCtx.fillStyle = fogGradient;
    fogCtx.fillRect(0, 0, width, height);

    fogCtx.fillStyle = "rgba(236, 249, 239, 0.72)";
    const textureCount = Math.max(24, Math.round((width * height) / 1600));
    for (let i = 0; i < textureCount; i += 1) {
      const x = (i * 29 + 12) % width;
      const y = (i * 47 + 18) % height;
      const radius = 15 + (i % 5) * 5;
      fogCtx.beginPath();
      fogCtx.arc(x, y, radius, 0, Math.PI * 2);
      fogCtx.fill();
    }
  }, [revealKey, width, height]);

  const eraseFogAtPoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const fogCanvas = fogCanvasRef.current;
    if (!fogCanvas) return;
    const fogCtx = fogCanvas.getContext("2d");
    if (!fogCtx) return;

    const rect = fogCanvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    const y = ((event.clientY - rect.top) / rect.height) * height;

    fogCtx.save();
    fogCtx.globalCompositeOperation = "destination-out";
    fogCtx.beginPath();
    fogCtx.arc(x, y, FOG_ERASE_RADIUS, 0, Math.PI * 2);
    fogCtx.fill();
    fogCtx.restore();
  };

  return (
    <canvas
      ref={fogCanvasRef}
      className={`absolute inset-0 z-10 touch-none ${roundedClassName}`}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        setIsErasingFog(true);
        eraseFogAtPoint(event);
      }}
      onPointerMove={(event) => {
        if (!isErasingFog) return;
        event.preventDefault();
        eraseFogAtPoint(event);
      }}
      onPointerUp={() => setIsErasingFog(false)}
      onPointerCancel={() => setIsErasingFog(false)}
      onPointerLeave={() => setIsErasingFog(false)}
      aria-label="Lớp sương mờ để bé chạm và xóa"
    />
  );
}
