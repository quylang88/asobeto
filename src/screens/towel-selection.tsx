"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Star } from "lucide-react";
import { Mascot } from "../components/beto-mascot";

interface Tower {
  id: number;
  name: string;
  letters: string;
  stars: number;
  maxStars: number;
  unlocked: boolean;
}

const towers: Tower[] = [
  {
    id: 1,
    name: "A-D",
    letters: "A, B, C, D",
    stars: 3,
    maxStars: 3,
    unlocked: true,
  },
  {
    id: 2,
    name: "E-H",
    letters: "E, F, G, H",
    stars: 2,
    maxStars: 3,
    unlocked: true,
  },
  {
    id: 3,
    name: "I-L",
    letters: "I, K, L",
    stars: 0,
    maxStars: 3,
    unlocked: true,
  },
  {
    id: 4,
    name: "M-P",
    letters: "M, N, O, P",
    stars: 0,
    maxStars: 3,
    unlocked: false,
  },
  {
    id: 5,
    name: "Q-T",
    letters: "Q, R, S, T",
    stars: 0,
    maxStars: 3,
    unlocked: false,
  },
];

interface TowerSelectionProps {
  worldId: number;
  worldName: string;
  onSelectTower: (towerId: number) => void;
  onBack: () => void;
}

export function TowerSelection({
  worldName,
  onSelectTower,
  onBack,
}: TowerSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-bright/20 via-background to-blue-soft/20">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm p-4 flex items-center gap-4 shadow-md">
        <motion.button
          onClick={onBack}
          className="p-3 bg-green-bright text-white rounded-2xl shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {worldName}
          </h1>
          <p className="text-sm text-muted-foreground">Choose a Tower</p>
        </div>
        <div className="ml-auto">
          <Mascot size="sm" emotion="happy" />
        </div>
      </div>

      {/* Isometric Grid of Towers */}
      <div className="p-6 md:p-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {towers.map((tower, index) => (
            <motion.button
              key={tower.id}
              onClick={() => tower.unlocked && onSelectTower(tower.id)}
              disabled={!tower.unlocked}
              className={`relative group ${!tower.unlocked ? "cursor-not-allowed" : ""}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={tower.unlocked ? { y: -8, scale: 1.02 } : {}}
              whileTap={tower.unlocked ? { scale: 0.98 } : {}}
            >
              {/* Stars above tower */}
              <div className="flex justify-center gap-1 mb-2">
                {[...Array(tower.maxStars)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 + i * 0.1 }}
                  >
                    <Star
                      className={`w-6 h-6 ${
                        i < tower.stars
                          ? "text-yellow-bright fill-yellow-bright"
                          : "text-gray-300 fill-gray-200"
                      }`}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Tower illustration */}
              <div className="relative">
                {/* Shadow */}
                <div
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-4 rounded-full ${
                    tower.unlocked ? "bg-green-bright/30" : "bg-gray-300/50"
                  }`}
                />

                {/* Tower SVG */}
                <svg viewBox="0 0 120 180" className="w-full h-48 md:h-56">
                  {/* Tower base */}
                  <rect
                    x="20"
                    y="40"
                    width="80"
                    height="130"
                    rx="8"
                    fill={tower.unlocked ? "#4ADE80" : "#9CA3AF"}
                  />

                  {/* Tower stripes/floors */}
                  {[0, 1, 2, 3].map((floor) => (
                    <rect
                      key={floor}
                      x="25"
                      y={50 + floor * 32}
                      width="70"
                      height="28"
                      rx="4"
                      fill={tower.unlocked ? "#86EFAC" : "#D1D5DB"}
                    />
                  ))}

                  {/* Tower top/roof */}
                  <polygon
                    points="60,5 20,40 100,40"
                    fill={tower.unlocked ? "#FB923C" : "#6B7280"}
                  />

                  {/* Flag */}
                  {tower.unlocked && (
                    <>
                      <line
                        x1="60"
                        y1="5"
                        x2="60"
                        y2="-15"
                        stroke="#8B5A2B"
                        strokeWidth="3"
                      />
                      <polygon points="60,-15 60,0 80,-7" fill="#EF4444" />
                    </>
                  )}

                  {/* Windows */}
                  {[0, 1, 2, 3].map((floor) => (
                    <g key={floor}>
                      <rect
                        x="35"
                        y={55 + floor * 32}
                        width="15"
                        height="18"
                        rx="7"
                        fill={tower.unlocked ? "#FEF3C7" : "#E5E7EB"}
                      />
                      <rect
                        x="70"
                        y={55 + floor * 32}
                        width="15"
                        height="18"
                        rx="7"
                        fill={tower.unlocked ? "#FEF3C7" : "#E5E7EB"}
                      />
                    </g>
                  ))}

                  {/* Door */}
                  <rect
                    x="45"
                    y="145"
                    width="30"
                    height="25"
                    rx="15"
                    fill={tower.unlocked ? "#8B5A2B" : "#4B5563"}
                  />

                  {/* Lock overlay for locked towers */}
                  {!tower.unlocked && (
                    <g>
                      <circle
                        cx="60"
                        cy="90"
                        r="25"
                        fill="#4B5563"
                        opacity="0.8"
                      />
                      <rect
                        x="50"
                        y="85"
                        width="20"
                        height="18"
                        rx="2"
                        fill="#9CA3AF"
                      />
                      <path
                        d="M 53 85 L 53 78 A 7 7 0 0 1 67 78 L 67 85"
                        stroke="#9CA3AF"
                        strokeWidth="4"
                        fill="none"
                      />
                    </g>
                  )}
                </svg>
              </div>

              {/* Tower info */}
              <div
                className={`mt-2 px-4 py-2 rounded-2xl ${
                  tower.unlocked ? "bg-white" : "bg-gray-100"
                } shadow-md`}
              >
                <h3
                  className={`text-lg font-bold ${tower.unlocked ? "text-foreground" : "text-gray-400"}`}
                >
                  Tower {tower.name}
                </h3>
                <p
                  className={`text-xs ${tower.unlocked ? "text-muted-foreground" : "text-gray-400"}`}
                >
                  {tower.letters}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
