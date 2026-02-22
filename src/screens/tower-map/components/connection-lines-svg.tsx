"use client";

import { motion } from "framer-motion";
import type { Tower } from "@/data/game-config";
import type { ConnectionLinesSVGProps } from "../types";

function getCurvedPath(x1: number, y1: number, x2: number, y2: number): string {
  const verticalDistance = Math.abs(y2 - y1);
  const curveStrength = Math.max(4, verticalDistance * 0.35);
  const controlY1 = y1 + curveStrength;
  const controlY2 = y2 - curveStrength;
  return `M ${x1} ${y1} C ${x1} ${controlY1}, ${x2} ${controlY2}, ${x2} ${y2}`;
}

function getRegularTowerAnchorOffsetPx(
  anchor: "top" | "bottom",
  isMdViewport: boolean,
): number {
  const starRowHeight = isMdViewport ? 20 : 16;
  const starRowBottomMargin = 4;
  const svgHeight = isMdViewport ? 96 : 80;
  const buttonHeight = starRowHeight + starRowBottomMargin + svgHeight;
  const svgTopOffset = -buttonHeight / 2 + starRowHeight + starRowBottomMargin;
  const svgAnchorY = anchor === "top" ? 5 : 93;
  return svgTopOffset + (svgAnchorY / 100) * svgHeight;
}

function getBossTowerAnchorOffsetPx(
  anchor: "top" | "bottom",
  isMdViewport: boolean,
): number {
  const svgHeight = isMdViewport ? 128 : 112;
  const svgCenterOffset = -svgHeight / 2;
  const svgAnchorY = anchor === "top" ? 3 : 115;
  return svgCenterOffset + (svgAnchorY / 120) * svgHeight;
}

function getTowerAnchorY(
  tower: Tower,
  anchor: "top" | "bottom",
  mapHeightPx: number,
  isMdViewport: boolean,
): number {
  if (mapHeightPx <= 0) {
    if (tower.isBoss) {
      return tower.position.y + (anchor === "top" ? -9 : 8.5);
    }
    return tower.position.y + (anchor === "top" ? -5 : 8);
  }

  const offsetPx = tower.isBoss
    ? getBossTowerAnchorOffsetPx(anchor, isMdViewport)
    : getRegularTowerAnchorOffsetPx(anchor, isMdViewport);
  return tower.position.y + (offsetPx / mapHeightPx) * 100;
}

function getTowerAnchorX(
  tower: Tower,
  mapWidthPx: number,
  isMdViewport: boolean,
): number {
  if (tower.isBoss) return tower.position.x;

  const offsetPx = isMdViewport ? -4 : -2.5;
  if (mapWidthPx <= 0) {
    return tower.position.x + (isMdViewport ? -0.3 : -0.6);
  }
  return tower.position.x + (offsetPx / mapWidthPx) * 100;
}

export function ConnectionLinesSVG({
  towers,
  connections,
  mapHeightPx,
  mapWidthPx,
}: ConnectionLinesSVGProps) {
  const isMdViewport = mapWidthPx >= 768;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {connections.map((conn, index) => {
        const fromTower = towers.find((tower) => tower.id === conn.from);
        const toTower = towers.find((tower) => tower.id === conn.to);

        if (!fromTower || !toTower) return null;

        const x1 = getTowerAnchorX(fromTower, mapWidthPx, isMdViewport);
        const y1 = getTowerAnchorY(
          fromTower,
          "bottom",
          mapHeightPx,
          isMdViewport,
        );
        const x2 = getTowerAnchorX(toTower, mapWidthPx, isMdViewport);
        const y2 = getTowerAnchorY(toTower, "top", mapHeightPx, isMdViewport);

        const isUnlocked = fromTower.completed;

        return (
          <g key={index}>
            <motion.path
              d={getCurvedPath(x1, y1, x2, y2)}
              stroke={isUnlocked ? "#4ADE80" : "#9CA3AF"}
              strokeWidth="1.3"
              strokeDasharray={isUnlocked ? "0" : "2.5 2.5"}
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              style={{
                filter: isUnlocked
                  ? "drop-shadow(0 0.5px 1px rgba(74, 222, 128, 0.5))"
                  : "none",
              }}
            />
            <circle
              cx={x1}
              cy={y1}
              r="0.75"
              fill={isUnlocked ? "#4ADE80" : "#9CA3AF"}
            />
            <circle
              cx={x2}
              cy={y2}
              r="0.75"
              fill={isUnlocked ? "#4ADE80" : "#9CA3AF"}
            />
          </g>
        );
      })}
    </svg>
  );
}
