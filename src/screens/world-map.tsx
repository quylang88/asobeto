"use client";

import { motion } from "framer-motion";
import { Lock, ChevronLeft } from "lucide-react";
import { Mascot } from "../components/beto-mascot";
import { worlds } from "../data/game-config";

interface WorldMapProps {
  onSelectWorld: (worldId: number) => void;
  onBack: () => void;
}

export function WorldMap({ onSelectWorld, onBack }: WorldMapProps) {
  return (
    <div className="fixed inset-0 flex flex-col bg-linear-to-b from-blue-soft/30 via-background to-green-bright/20 overflow-hidden">
      {/* Header - vùng an toàn iOS */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-md pt-safe">
        <div className="p-4 flex items-center gap-4">
          <motion.button
            onClick={onBack}
            className="p-3 bg-green-bright text-white rounded-2xl shadow-lg ios-button"
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Thế Giới Diệu Kỳ
          </h1>
          <div className="ml-auto">
            <Mascot size="sm" emotion="happy" />
          </div>
        </div>
      </div>

      {/* Đường dẫn bản đồ - Khu vực cuộn */}
      <div className="flex-1 relative py-12 px-4 app-scroll pb-safe overflow-y-auto">
        {/* Đường nối nét đứt giữa các world */}
        <svg
          className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-4 pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <line
            x1="50%"
            y1="0"
            x2="50%"
            y2="100%"
            stroke="#4ADE80"
            strokeWidth="4"
            strokeDasharray="12 8"
          />
        </svg>

        <div className="relative z-10 flex flex-col items-center gap-8 max-w-lg mx-auto pb-20">
          {worlds.map((world, index) => (
            <motion.div
              key={world.id}
              className={`w-full ${index % 2 === 0 ? "pr-8" : "pl-8"}`}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
            >
              <motion.button
                onClick={() => world.unlocked && onSelectWorld(world.id)}
                disabled={!world.unlocked}
                className={`relative w-full group ios-button ${!world.unlocked ? "cursor-not-allowed" : ""}`}
                animate={world.unlocked ? { y: [0, -5, 0] } : {}}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.3,
                }}
                whileTap={world.unlocked ? { scale: 0.95 } : {}}
              >
                {/* Bóng thẻ */}
                <div
                  className={`absolute inset-0 rounded-3xl translate-y-2 ${
                    world.unlocked ? world.color : "bg-gray-400"
                  } opacity-50`}
                />

                {/* Thẻ chính */}
                <div
                  className={`relative rounded-3xl p-6 overflow-hidden ${
                    world.unlocked
                      ? `bg-linear-to-br ${world.bgColor}`
                      : "bg-gray-300"
                  } shadow-xl`}
                >
                  {/* Minh họa đảo */}
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 shrink-0">
                      {/* Hình dạng đảo */}
                      <svg viewBox="0 0 80 80" className="w-full h-full">
                        <ellipse
                          cx="40"
                          cy="60"
                          rx="35"
                          ry="15"
                          fill={world.unlocked ? "#8B5A2B" : "#9CA3AF"}
                        />
                        <ellipse
                          cx="40"
                          cy="55"
                          rx="30"
                          ry="20"
                          fill={world.unlocked ? "#22C55E" : "#6B7280"}
                        />
                        {world.theme === "Rừng Xanh" && world.unlocked && (
                          <>
                            <polygon
                              points="40,10 30,40 50,40"
                              fill="#166534"
                            />
                            <polygon
                              points="55,20 48,45 62,45"
                              fill="#15803D"
                            />
                          </>
                        )}
                        {world.theme === "Bầu Trời" && world.unlocked && (
                          <>
                            <circle
                              cx="30"
                              cy="25"
                              r="12"
                              fill="white"
                              opacity="0.9"
                            />
                            <circle
                              cx="45"
                              cy="22"
                              r="10"
                              fill="white"
                              opacity="0.8"
                            />
                          </>
                        )}
                        {world.theme === "Phép Thuật" && world.unlocked && (
                          <>
                            <circle cx="40" cy="25" r="5" fill="#FBBF24" />
                            <circle cx="30" cy="35" r="3" fill="#F472B6" />
                            <circle cx="50" cy="32" r="4" fill="#A78BFA" />
                          </>
                        )}
                        {world.theme === "Cổ Tích" && world.unlocked && (
                          <>
                            <rect
                              x="35"
                              y="15"
                              width="10"
                              height="30"
                              fill="#DC2626"
                              rx="2"
                            />
                            <polygon points="40,5 32,18 48,18" fill="#FBBF24" />
                          </>
                        )}
                      </svg>

                      {!world.unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <h3
                        className={`text-xl font-bold ${world.unlocked ? "text-white" : "text-gray-500"}`}
                      >
                        {world.name}
                      </h3>
                      <p
                        className={`text-sm ${world.unlocked ? "text-white/80" : "text-gray-400"}`}
                      >
                        Chủ đề {world.theme}
                      </p>

                      {/* Thanh tiến trình */}
                      {world.unlocked && (
                        <div className="mt-2 h-3 bg-white/30 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-white rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${world.progress}%` }}
                            transition={{
                              delay: 0.5 + index * 0.1,
                              duration: 0.8,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
