"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Star, Lock } from "lucide-react";
import { Mascot } from "../components/beto-mascot";
import {
  getWorldData,
  getTotalStars,
  canUnlockBoss,
  type Tower,
  type TowerConnection,
} from "../data/game-config";
import { hydrateTowersWithStoredProgress } from "@/lib/floor-progress";

interface TowerSelectionProps {
  worldId: number;
  worldName: string;
  onSelectTower: (towerId: number) => void;
  onBack: () => void;
}

// Helper tạo đường cong SVG cho các kết nối
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
  // Top lấy theo phần trang trí đỉnh gần nhất (vòng tròn đỉnh nằm từ y=3)
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

// Component Sao bay cho hiệu ứng mở khóa
function FlyingStar({
  startX,
  startY,
  endX,
  endY,
  delay,
  onComplete,
}: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  onComplete?: () => void;
}) {
  return (
    <motion.div
      className="fixed z-50 pointer-events-none"
      initial={{ x: startX, y: startY, scale: 1, opacity: 1 }}
      animate={{
        x: endX,
        y: endY,
        scale: [1, 1.5, 0.5],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: "easeInOut",
      }}
      onAnimationComplete={onComplete}
    >
      <Star className="w-8 h-8 text-yellow-bright fill-yellow-bright drop-shadow-lg" />
    </motion.div>
  );
}

// Component Node Tháp
function TowerNode({
  tower,
  totalStars,
  requiredStars,
  canBossUnlock,
  onSelect,
  onBossUnlock,
}: {
  tower: Tower;
  totalStars: number;
  requiredStars: number;
  canBossUnlock: boolean;
  onSelect: (id: number) => void;
  onBossUnlock: () => void;
}) {
  const canUnlock = tower.isBoss && canBossUnlock;
  const isLocked = !tower.unlocked && !canUnlock;

  const handleTap = () => {
    if (tower.isBoss) {
      if (canUnlock) {
        onBossUnlock();
      }
      return;
    }
    if (tower.unlocked) {
      onSelect(tower.id);
    }
  };

  if (tower.isBoss) {
    return (
      <motion.button
        onClick={handleTap}
        disabled={!canUnlock && !tower.unlocked}
        className={`absolute -translate-x-1/2 -translate-y-1/2 ios-button ${
          !canUnlock && !tower.unlocked ? "cursor-not-allowed" : ""
        }`}
        style={{ left: `${tower.position.x}%`, top: `${tower.position.y}%` }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        whileTap={canUnlock ? { scale: 0.95 } : {}}
      >
        {/* Boss Tower - Thiết kế cổng vàng đặc biệt */}
        <div className="relative">
          {/* Hiệu ứng phát sáng */}
          {canUnlock && (
            <motion.div
              className="absolute inset-0 rounded-full bg-yellow-bright/50 blur-xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 120, height: 120, left: -10, top: -10 }}
            />
          )}

          <svg viewBox="0 0 100 120" className="w-24 h-28 md:w-28 md:h-32">
            {/* Chân cổng */}
            <rect
              x="10"
              y="30"
              width="80"
              height="85"
              rx="8"
              fill={canUnlock ? "#F59E0B" : "#6B7280"}
            />

            {/* Cột cổng */}
            <rect
              x="10"
              y="30"
              width="15"
              height="85"
              fill={canUnlock ? "#D97706" : "#4B5563"}
            />
            <rect
              x="75"
              y="30"
              width="15"
              height="85"
              fill={canUnlock ? "#D97706" : "#4B5563"}
            />

            {/* Vòm cổng */}
            <path
              d="M 10 30 Q 50 0 90 30"
              fill={canUnlock ? "#FBBF24" : "#9CA3AF"}
            />

            {/* Trang trí đỉnh */}
            <circle
              cx="50"
              cy="15"
              r="12"
              fill={canUnlock ? "#FCD34D" : "#9CA3AF"}
            />
            <Star
              className="absolute"
              style={{ left: 38, top: 3, width: 24, height: 24 }}
            />

            {/* Cánh cổng */}
            <rect
              x="30"
              y="55"
              width="40"
              height="55"
              rx="4"
              fill={canUnlock ? "#78350F" : "#374151"}
            />
            <line
              x1="50"
              y1="55"
              x2="50"
              y2="110"
              stroke={canUnlock ? "#451A03" : "#1F2937"}
              strokeWidth="2"
            />

            {/* Chỉ báo khóa hoặc sao */}
            {!canUnlock && (
              <g>
                <circle cx="50" cy="80" r="15" fill="#4B5563" />
                <rect
                  x="42"
                  y="77"
                  width="16"
                  height="12"
                  rx="2"
                  fill="#9CA3AF"
                />
                <path
                  d="M 45 77 L 45 72 A 5 5 0 0 1 55 72 L 55 77"
                  stroke="#9CA3AF"
                  strokeWidth="3"
                  fill="none"
                />
              </g>
            )}

            {canUnlock && (
              <motion.g
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <circle cx="50" cy="80" r="12" fill="#FCD34D" />
                <Star
                  className="w-5 h-5 text-amber-800"
                  style={{ x: 42, y: 72 }}
                />
              </motion.g>
            )}
          </svg>

          {/* Hiển thị số sao hiện tại */}
          <div className="absolute -top-2 -right-10 md:-right-12 flex items-center gap-1 bg-white rounded-full px-2 py-1 shadow-lg z-10">
            <Star className="w-4 h-4 text-yellow-bright fill-yellow-bright" />
            <span className="text-xs font-bold text-foreground">
              {totalStars}/{requiredStars}
            </span>
          </div>
        </div>
      </motion.button>
    );
  }

  // Tháp thường
  return (
    <motion.button
      onClick={handleTap}
      disabled={isLocked}
      className={`absolute -translate-x-1/2 -translate-y-1/2 ios-button ${
        isLocked ? "cursor-not-allowed" : ""
      }`}
      style={{ left: `${tower.position.x}%`, top: `${tower.position.y}%` }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: tower.id * 0.1 }}
      whileTap={tower.unlocked ? { scale: 0.95 } : {}}
    >
      {/* Sao trên tháp */}
      <div className="flex justify-center gap-0.5 mb-1">
        {[...Array(tower.maxStars)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3 + tower.id * 0.1 + i * 0.1 }}
          >
            <Star
              className={`w-4 h-4 md:w-5 md:h-5 ${
                i < tower.stars
                  ? "text-yellow-bright fill-yellow-bright"
                  : "text-gray-300 fill-gray-200"
              }`}
            />
          </motion.div>
        ))}
      </div>

      {/* SVG Tháp */}
      <div className="relative">
        <svg viewBox="0 0 80 100" className="w-16 h-20 md:w-20 md:h-24">
          {/* Bóng tháp */}
          <ellipse
            cx="40"
            cy="95"
            rx="25"
            ry="5"
            fill={
              tower.unlocked
                ? "rgba(74, 222, 128, 0.3)"
                : "rgba(156, 163, 175, 0.3)"
            }
          />

          {/* Thân tháp */}
          <rect
            x="15"
            y="25"
            width="50"
            height="68"
            rx="6"
            fill={tower.unlocked ? "#4ADE80" : "#9CA3AF"}
          />

          {/* Các tầng tháp */}
          {[0, 1, 2].map((floor) => (
            <rect
              key={floor}
              x="20"
              y={32 + floor * 20}
              width="40"
              height="16"
              rx="3"
              fill={tower.unlocked ? "#86EFAC" : "#D1D5DB"}
            />
          ))}

          {/* Mái tháp */}
          <polygon
            points="40,5 15,25 65,25"
            fill={tower.unlocked ? "#FB923C" : "#6B7280"}
          />

          {/* Cờ trên các tháp đã hoàn thành */}
          {tower.completed && tower.unlocked && (
            <>
              <line
                x1="40"
                y1="5"
                x2="40"
                y2="-8"
                stroke="#8B5A2B"
                strokeWidth="2"
              />
              <polygon points="40,-8 40,2 55,-3" fill="#EF4444" />
            </>
          )}

          {/* Cửa sổ */}
          {[0, 1, 2].map((floor) => (
            <g key={floor}>
              <rect
                x="25"
                y={35 + floor * 20}
                width="10"
                height="10"
                rx="5"
                fill={tower.unlocked ? "#FEF3C7" : "#E5E7EB"}
              />
              <rect
                x="45"
                y={35 + floor * 20}
                width="10"
                height="10"
                rx="5"
                fill={tower.unlocked ? "#FEF3C7" : "#E5E7EB"}
              />
            </g>
          ))}

          {/* Cửa chính */}
          <rect
            x="32"
            y="80"
            width="16"
            height="13"
            rx="8"
            fill={tower.unlocked ? "#8B5A2B" : "#4B5563"}
          />

          {/* Tên tháp ở giữa tháp */}
          <text
            x="40"
            y="56"
            textAnchor="middle"
            dominantBaseline="middle"
            className={`text-[12px] font-extrabold font-hp-special tracking-wide ${
              tower.unlocked ? "fill-emerald-900" : "fill-gray-500"
            }`}
          >
            {tower.name}
          </text>

          {/* Lớp phủ khóa */}
          {!tower.unlocked && (
            <g>
              <circle cx="40" cy="55" r="15" fill="#4B5563" opacity="0.9" />
              <Lock
                x={30}
                y={45}
                width={20}
                height={20}
                className="text-gray-400"
              />
            </g>
          )}
        </svg>
      </div>
    </motion.button>
  );
}

// Kết nối SVG dựa trên phần trăm
function ConnectionLinesSVG({
  towers,
  connections,
  mapHeightPx,
  mapWidthPx,
}: {
  towers: Tower[];
  connections: TowerConnection[];
  mapHeightPx: number;
  mapWidthPx: number;
}) {
  const isMdViewport = mapWidthPx >= 768;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {connections.map((conn, index) => {
        const fromTower = towers.find((t) => t.id === conn.from);
        const toTower = towers.find((t) => t.id === conn.to);

        if (!fromTower || !toTower) return null;

        const x1 = fromTower.position.x;
        const y1 = getTowerAnchorY(
          fromTower,
          "bottom",
          mapHeightPx,
          isMdViewport,
        );
        const x2 = toTower.position.x;
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
            <circle cx={x1} cy={y1} r="0.75" fill={isUnlocked ? "#4ADE80" : "#9CA3AF"} />
            <circle cx={x2} cy={y2} r="0.75" fill={isUnlocked ? "#4ADE80" : "#9CA3AF"} />
          </g>
        );
      })}
    </svg>
  );
}

export function TowerSelection({
  worldId,
  worldName,
  onSelectTower,
  onBack,
}: TowerSelectionProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const worldData = getWorldData(worldId);
  const towerState = useMemo(
    () =>
      hydrateTowersWithStoredProgress({
        worldId,
        towers: worldData.towers,
      }),
    [worldId, worldData.towers],
  );
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [flyingStars, setFlyingStars] = useState<
    { id: number; startX: number; startY: number; endX: number; endY: number }[]
  >([]);
  const [showFlash, setShowFlash] = useState(false);
  const [mapDimensions, setMapDimensions] = useState({
    width: 0,
    height: 0,
  });

  const totalStars = getTotalStars(towerState.filter((t) => !t.isBoss));
  const requiredStars = 15;
  const isBossUnlockable = canUnlockBoss(towerState, requiredStars);

  useEffect(() => {
    const element = mapRef.current;
    if (!element) return;

    const updateDimensions = () => {
      const rect = element.getBoundingClientRect();
      setMapDimensions({
        width: rect.width,
        height: rect.height,
      });
    };

    updateDimensions();

    const observer = new ResizeObserver(() => {
      updateDimensions();
    });
    observer.observe(element);

    window.addEventListener("resize", updateDimensions);
    return () => {
      window.removeEventListener("resize", updateDimensions);
      observer.disconnect();
    };
  }, []);

  const handleBossUnlock = useCallback(() => {
    if (isUnlocking) return;
    setIsUnlocking(true);

    // Lấy vị trí cho hoạt ảnh
    const starCounterRect = document
      .getElementById("star-counter")
      ?.getBoundingClientRect();
    const bossTowerRect = document
      .getElementById("boss-tower")
      ?.getBoundingClientRect();

    if (!starCounterRect || !bossTowerRect) {
      // Dự phòng: chỉ điều hướng
      setTimeout(() => {
        onSelectTower(6);
      }, 500);
      return;
    }

    const endX = bossTowerRect.left + bossTowerRect.width / 2 - 16;
    const endY = bossTowerRect.top + bossTowerRect.height / 2 - 16;

    // Tạo sao bay
    const stars = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      startX: starCounterRect.left + Math.random() * 40,
      startY: starCounterRect.top + Math.random() * 20,
      endX: endX + (Math.random() - 0.5) * 40,
      endY: endY + (Math.random() - 0.5) * 40,
    }));

    setFlyingStars(stars);

    // Hiển thị chớp sáng sau khi sao đến nơi
    setTimeout(() => {
      setShowFlash(true);
    }, 900);

    // Điều hướng sau khi hoạt ảnh hoàn tất
    setTimeout(() => {
      onSelectTower(6);
    }, 1500);
  }, [isUnlocking, onSelectTower]);

  return (
    <div className="relative w-full h-dvh flex flex-col bg-linear-to-b from-green-bright/20 via-background to-blue-soft/20 overflow-hidden">
      {/* Header - vùng an toàn iOS */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-md pt-safe">
        <div className="flex items-center gap-3 p-4">
          <motion.button
            onClick={onBack}
            className="p-3 bg-green-bright text-white rounded-2xl shadow-lg ios-button"
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {worldName}
            </h1>
            <p className="text-xs text-muted-foreground">
              Chọn Tháp Để Học Nha Bé
            </p>
          </div>
          {/* Bộ đếm tổng số sao */}
          <div
            id="star-counter"
            className="flex items-center gap-2 bg-yellow-bright/20 px-3 py-2 rounded-2xl"
          >
            <Star className="w-5 h-5 text-yellow-bright fill-yellow-bright" />
            <span className="font-bold text-foreground">{totalStars}</span>
          </div>
          <Mascot size="sm" emotion="happy" />
        </div>
      </div>

      {/* Bản đồ tháp - Khu vực cuộn */}
      <div ref={mapRef} className="flex-1 relative pb-safe overflow-hidden">
        <div className="relative w-full h-full">
          {/* Đường kết nối */}
          <ConnectionLinesSVG
            towers={towerState}
            connections={worldData.towerConnections}
            mapHeightPx={mapDimensions.height}
            mapWidthPx={mapDimensions.width}
          />

          {/* Các node tháp */}
          {towerState.map((tower) => (
            <div
              key={tower.id}
              id={tower.isBoss ? "boss-tower" : undefined}
              className="contents"
            >
              <TowerNode
                tower={tower}
                totalStars={totalStars}
                requiredStars={requiredStars}
                canBossUnlock={isBossUnlockable}
                onSelect={onSelectTower}
                onBossUnlock={handleBossUnlock}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Hoạt ảnh sao bay */}
      <AnimatePresence>
        {flyingStars.map((star, index) => (
          <FlyingStar
            key={star.id}
            startX={star.startX}
            startY={star.startY}
            endX={star.endX}
            endY={star.endY}
            delay={index * 0.08}
          />
        ))}
      </AnimatePresence>

      {/* Hiệu ứng chớp sáng */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="fixed inset-0 z-50 bg-yellow-bright/80 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6 }}
            onAnimationComplete={() => setShowFlash(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
