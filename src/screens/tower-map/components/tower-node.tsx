"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { LetterBlock } from "@/components/common/letter-block";
import type { TowerNodeProps } from "../types";

export function TowerNode({
  tower,
  theme,
  totalStars,
  requiredStars,
  canBossUnlock,
  onSelect,
  onBossUnlock,
}: TowerNodeProps) {
  const canUnlock = tower.isBoss && canBossUnlock;
  const isBossAccessible = tower.isBoss && (tower.unlocked || canUnlock);
  const isLocked = tower.isBoss ? !isBossAccessible : !tower.unlocked;

  const handleTap = () => {
    if (tower.isBoss) {
      if (!isBossAccessible) {
        return;
      }
      if (!tower.unlocked && canUnlock) {
        onBossUnlock();
        return;
      }
      onSelect(tower.id);
      return;
    }
    if (tower.unlocked) {
      onSelect(tower.id);
    }
  };

  if (tower.isBoss) {
    return (
      <motion.button
        id="boss-tower"
        onClick={handleTap}
        disabled={!isBossAccessible}
        className={`absolute -translate-x-1/2 -translate-y-1/2 ios-button ${
          !isBossAccessible ? "cursor-not-allowed" : ""
        }`}
        style={{ left: `${tower.position.x}%`, top: `${tower.position.y}%` }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        whileTap={isBossAccessible ? { scale: 0.95 } : {}}
      >
        <div className="relative">
          {isBossAccessible && (
            <motion.div
              className="absolute inset-0 rounded-full blur-xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                width: 120,
                height: 120,
                left: -10,
                top: -10,
                backgroundColor: theme.bossAura,
              }}
            />
          )}

          <svg viewBox="0 0 100 120" className="w-24 h-28 md:w-28 md:h-32">
            <rect
              x="10"
              y="30"
              width="80"
              height="85"
              rx="8"
              fill={isBossAccessible ? theme.bossBody : "#6B7280"}
            />

            <rect
              x="10"
              y="30"
              width="15"
              height="85"
              fill={isBossAccessible ? theme.bossSide : "#4B5563"}
            />
            <rect
              x="75"
              y="30"
              width="15"
              height="85"
              fill={isBossAccessible ? theme.bossSide : "#4B5563"}
            />

            <path
              d="M 10 30 Q 50 0 90 30"
              fill={isBossAccessible ? theme.bossRoof : "#9CA3AF"}
            />

            <circle
              cx="50"
              cy="15"
              r="12"
              fill={isBossAccessible ? theme.bossTop : "#9CA3AF"}
            />

            <rect
              x="30"
              y="55"
              width="40"
              height="55"
              rx="4"
              fill={isBossAccessible ? theme.bossDoor : "#374151"}
            />
            <line
              x1="50"
              y1="55"
              x2="50"
              y2="110"
              stroke={isBossAccessible ? theme.bossDoorLine : "#1F2937"}
              strokeWidth="2"
            />

            {!isBossAccessible && (
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

            {isBossAccessible && (
              <motion.g
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <circle cx="50" cy="80" r="12" fill={theme.bossOrb} />
              </motion.g>
            )}
          </svg>

          <div
            id="boss-tower-target"
            className="absolute left-1/2 top-[66%] h-1 w-1 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          />

          {!tower.unlocked && (
            <div className="absolute -top-2 -right-10 md:-right-12 flex items-center gap-1 bg-white rounded-full px-2 py-1 shadow-lg z-10">
              <Star className="w-4 h-4 text-yellow-bright fill-yellow-bright" />
              <span className="text-xs font-bold text-foreground">
                {totalStars}/{requiredStars}
              </span>
            </div>
          )}
        </div>
      </motion.button>
    );
  }

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
      <div className="mb-1 flex justify-center gap-0.5">
        {[...Array(tower.maxStars)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3 + tower.id * 0.1 + i * 0.1 }}
          >
            <Star
              className={`h-4 w-4 md:h-5 md:w-5 ${
                i < tower.stars
                  ? "text-yellow-bright fill-yellow-bright"
                  : "text-gray-300 fill-gray-200"
              }`}
            />
          </motion.div>
        ))}
      </div>

      <div className="relative">
        <svg viewBox="0 0 80 100" className="h-20 w-16 md:h-24 md:w-20">
          <ellipse
            cx="40"
            cy="95"
            rx="25"
            ry="5"
            fill={
              tower.unlocked
                ? theme.regularTowerShadow
                : "rgba(156, 163, 175, 0.3)"
            }
          />

          <rect
            x="15"
            y="25"
            width="50"
            height="68"
            rx="6"
            fill={tower.unlocked ? theme.regularTowerBody : "#9CA3AF"}
          />

          {[0, 1, 2].map((floor) => (
            <rect
              key={floor}
              x="20"
              y={32 + floor * 20}
              width="40"
              height="16"
              rx="3"
              fill={tower.unlocked ? theme.regularTowerFloor : "#D1D5DB"}
            />
          ))}

          <polygon
            points="40,5 15,25 65,25"
            fill={tower.unlocked ? theme.regularTowerRoof : "#6B7280"}
          />

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

          {[0, 1, 2].map((floor) => (
            <g key={floor}>
              <rect
                x="25"
                y={35 + floor * 20}
                width="10"
                height="10"
                rx="5"
                fill={tower.unlocked ? theme.regularTowerWindow : "#E5E7EB"}
              />
              <rect
                x="45"
                y={35 + floor * 20}
                width="10"
                height="10"
                rx="5"
                fill={tower.unlocked ? theme.regularTowerWindow : "#E5E7EB"}
              />
            </g>
          ))}

          <rect
            x="32"
            y="80"
            width="16"
            height="13"
            rx="8"
            fill={tower.unlocked ? theme.regularTowerDoor : "#4B5563"}
          />
        </svg>
        <div className="pointer-events-none absolute left-0 top-0 h-20 w-16 md:h-24 md:w-20">
          <div className="absolute left-1/2 top-[59%] -translate-x-1/2 -translate-y-1/2">
            <LetterBlock
              letter={(tower.name.trim().charAt(0) || "?").toLocaleLowerCase()}
              color={theme.regularTowerBody}
              size="xs"
              locked={!tower.unlocked}
              flat
            />
          </div>
        </div>
      </div>
    </motion.button>
  );
}
