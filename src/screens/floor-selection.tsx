"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Star,
  Lock,
  Sparkles,
  RefreshCw,
  Unlock,
} from "lucide-react";
// We keep the mascot if needed, or we can remove it if it clutters the view.
// For now, I'll comment it out to focus on the requested layout,
// as the "Vertical Stack" requirement is strict about fitting in viewport.
// import { Mascot } from "../components/beto-mascot";

interface Floor {
  id: number;
  type: 'boss' | 'letter';
  label: string;
  subLabel: string;
  stars: number;
  maxStars: number;
  isLocked: boolean;
  minStarsToUnlock?: number;
  theme?: 'green' | 'blue' | 'orange';
}

const initialFloorData: Floor[] = [
  {
    id: 4,
    type: 'boss',
    label: "Ôn Tập",
    subLabel: "Tổng hợp A-Ă-Â",
    stars: 0,
    maxStars: 4,
    isLocked: true,
    minStarsToUnlock: 10
  },
  {
    id: 3,
    type: 'letter',
    label: "Â",
    subLabel: "Cái Cân",
    stars: 0,
    maxStars: 4,
    isLocked: true,
    theme: 'orange'
  },
  {
    id: 2,
    type: 'letter',
    label: "Ă",
    subLabel: "Mặt Trăng",
    stars: 3,
    maxStars: 4,
    isLocked: true,
    theme: 'blue'
  },
  {
    id: 1,
    type: 'letter',
    label: "A",
    subLabel: "Con Cá",
    stars: 4,
    maxStars: 4,
    isLocked: false,
    theme: 'green'
  }
];

interface FloorSelectionProps {
  towerId: number;
  towerName: string;
  onSelectFloor: (floorId: number) => void;
  onBack: () => void;
}

export function FloorSelection({
  towerName,
  onSelectFloor,
  onBack,
}: FloorSelectionProps) {
  const [floors, setFloors] = useState<Floor[]>(initialFloorData);
  const [isUnlockingBoss, setIsUnlockingBoss] = useState(false);

  // Helper to calculate total stars
  const totalStars = floors.reduce((acc, floor) => acc + floor.stars, 0);

  // Dev Tool: Reset
  const handleReset = () => {
    setFloors(initialFloorData);
    setIsUnlockingBoss(false);
  };

  // Dev Tool: Simulate 10 Stars (Unlock up to Boss requirement)
  const handleSimulateUnlock = () => {
    const newFloors = floors.map(f => {
      if (f.type === 'letter') {
        return { ...f, stars: 4, isLocked: false }; // Max out letters
      }
      return f;
    });
    setFloors(newFloors);
  };

  // Unlock logic: Check if previous floor is done to unlock next
  // Note: This effect runs on mount and when floors change to ensure consistency
  useEffect(() => {
    let changed = false;
    const newFloors = [...floors];

    // Bottom-up unlock logic
    // We iterate from bottom (index 3, id 1) up to top
    // actually initialData is Top(0) -> Bottom(3)

    // Floor 1 (index 3) is always unlocked initially in mock data, but let's ensure
    // If Floor 1 is complete (e.g. >0 stars? or just exists?), Floor 2 unlocks?
    // Requirement: "Floor 2 unlocks only when Floor 1 is complete"
    // We assume "complete" means at least 1 star? Or just "finished"?
    // The prompt says "Floor 1 Starts Unlocked". "Floor 2 unlocks only when Floor 1 is complete."
    // For this mock, let's assume if stars > 0, it's "complete" enough to unlock next,
    // OR we can just rely on the mock data's initial state and the manual interaction for now.
    // However, to make it feel alive, let's say if Floor N has stars > 0, Floor N+1 unlocks (unless it's Boss).

    for (let i = newFloors.length - 1; i > 0; i--) {
        const current = newFloors[i];
        const nextAbove = newFloors[i-1]; // The one above it

        if (current.stars > 0 && nextAbove.type !== 'boss' && nextAbove.isLocked) {
             newFloors[i-1] = { ...nextAbove, isLocked: false };
             changed = true;
        }
    }

    if (changed) {
        setFloors(newFloors);
    }
  }, [floors]);


  const handleFloorClick = (floor: Floor) => {
    if (floor.isLocked) {
        // Boss Lock Logic
        if (floor.type === 'boss') {
            if (totalStars >= (floor.minStarsToUnlock || 10)) {
                // Trigger Magic Ritual
                triggerBossUnlock();
            } else {
                 // Shake or show toast "Need 10 stars"
                 alert(`Need ${floor.minStarsToUnlock} stars to unlock Boss! Current: ${totalStars}`);
            }
        }
        return;
    }

    // Enter Level
    onSelectFloor(floor.id);
  };

  const triggerBossUnlock = () => {
      setIsUnlockingBoss(true);
      // Animation delay then unlock
      setTimeout(() => {
          setFloors(prev => prev.map(f => f.type === 'boss' ? { ...f, isLocked: false } : f));
          setIsUnlockingBoss(false);
      }, 2000); // 2 seconds animation
  };

  return (
    <div className="h-screen flex flex-col bg-linear-to-b from-purple-100 via-background to-green-50 overflow-hidden relative touch-none">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-safe flex items-center justify-between">
         <motion.button
            onClick={onBack}
            className="p-2 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/50"
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </motion.button>

          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-white/50">
             <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
             <span className="font-bold text-slate-700">{totalStars}/16</span>
          </div>
      </div>

      {/* Main Content - Vertical Stack (Bottom-Up) */}
      <div className="flex-1 w-full max-w-[420px] mx-auto flex flex-col justify-between pb-safe pt-24 px-4">

        {/* Render all floors in order (Boss -> Floor 3 -> 2 -> 1) */}
        {floors.map(floor => (
           <div key={floor.id} className="w-full py-1">
               {floor.type === 'boss' ? (
                   <BossFloor floor={floor} totalStars={totalStars} onClick={() => handleFloorClick(floor)} isUnlocking={isUnlockingBoss} />
               ) : (
                   <RegularFloor floor={floor} onClick={() => handleFloorClick(floor)} />
               )}
           </div>
        ))}
      </div>

      {/* Dev Tools */}
       {(process.env.NODE_ENV === 'development' || true) && ( // Keeping true for demo as requested "Add 2 buttons"
        <div className="absolute bottom-4 right-4 z-50 flex flex-col gap-2">
            <button onClick={handleReset} className="p-2 bg-gray-800 text-white rounded-full shadow-lg text-xs flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                <RefreshCw size={14} /> Reset
            </button>
            <button onClick={handleSimulateUnlock} className="p-2 bg-blue-600 text-white rounded-full shadow-lg text-xs flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                <Unlock size={14} /> +10 Stars
            </button>
        </div>
      )}

      {/* Magic Ritual Overlay */}
      <AnimatePresence>
        {isUnlockingBoss && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 pointer-events-none"
            >
                 {/* 1. Darken background slightly */}
                 <div className="absolute inset-0 bg-black/40" />

                 {/* 2. Stars flying up */}
                 {[...Array(6)].map((_, i) => (
                     <motion.div
                         key={i}
                         className="absolute"
                         // Start position: Bottom half of screen, spread out
                         initial={{
                             top: "70%",
                             left: "50%",
                             x: (i - 2.5) * 60,
                             y: 0,
                             opacity: 0,
                             scale: 0.5
                         }}
                         // End position: Top area (Boss Lock), converge
                         animate={{
                             top: "15%",
                             x: 0,
                             y: 0,
                             opacity: [0, 1, 1, 0], // Fade out at end
                             scale: [0.5, 1.2, 0.2] // Grow then shrink into lock
                         }}
                         transition={{
                             duration: 1.2,
                             delay: i * 0.1,
                             ease: "easeInOut"
                         }}
                     >
                         <Star className="w-8 h-8 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,1)]" />
                     </motion.div>
                 ))}

                 {/* 3. Final Flash */}
                 <motion.div
                    className="absolute top-[15%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full blur-xl"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 3, 4] }}
                    transition={{ delay: 1.0, duration: 0.6 }}
                 />
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub Components ---

function RegularFloor({ floor, onClick }: { floor: Floor; onClick: () => void }) {
    const isCompleted = floor.stars === floor.maxStars;

    // Theme mapping
    const themeStyles = {
        green: {
            border: 'border-green-200',
            shadow: 'shadow-green-100/50',
            iconBg: 'bg-green-bright/10',
            iconBorder: 'border-green-bright',
            iconText: 'text-green-bright'
        },
        blue: {
            border: 'border-blue-200',
            shadow: 'shadow-blue-100/50',
            iconBg: 'bg-blue-soft/10',
            iconBorder: 'border-blue-soft',
            iconText: 'text-blue-soft'
        },
        orange: {
            border: 'border-orange-200',
            shadow: 'shadow-orange-100/50',
            iconBg: 'bg-orange-bright/10',
            iconBorder: 'border-orange-bright',
            iconText: 'text-orange-bright'
        }
    };

    const theme = floor.theme && themeStyles[floor.theme] ? themeStyles[floor.theme] : themeStyles.green;

    return (
        <motion.button
            onClick={onClick}
            whileTap={!floor.isLocked ? { scale: 0.98 } : {}}
            className={`w-full relative h-20 md:h-24 rounded-3xl border-b-4 transition-all duration-200
                ${floor.isLocked
                    ? 'bg-gray-100 border-gray-300 text-gray-400'
                    : `bg-white ${theme.border} shadow-lg ${theme.shadow}`
                }
            `}
        >
             <div className="absolute inset-0 flex items-center px-6 gap-4">
                 {/* Icon / Typography */}
                 <div className={`
                    w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl md:text-2xl font-bold border-2
                    ${floor.isLocked
                        ? 'bg-gray-200 border-gray-300'
                        : `${theme.iconBg} ${theme.iconBorder} ${theme.iconText}`
                    }
                 `}>
                    {floor.isLocked ? <Lock size={20} /> : floor.label}
                 </div>

                 {/* Info */}
                 <div className="flex-1 flex flex-col items-start">
                     <div className="flex items-center gap-2">
                        <span className={`font-bold text-lg ${floor.isLocked ? 'text-gray-400' : 'text-slate-700'}`}>
                            {floor.isLocked ? "Locked" : floor.label}
                        </span>
                        {!floor.isLocked && (
                             <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {floor.subLabel}
                             </span>
                        )}
                     </div>

                     {/* Stars */}
                     {!floor.isLocked && (
                         <div className="flex gap-1 mt-1">
                             {[...Array(floor.maxStars)].map((_, i) => (
                                 <StarIcon key={i} filled={i < floor.stars} isShiny={floor.stars === floor.maxStars} />
                             ))}
                         </div>
                     )}
                 </div>
             </div>
        </motion.button>
    )
}

function BossFloor({ floor, totalStars, onClick, isUnlocking }: { floor: Floor; totalStars: number; onClick: () => void; isUnlocking: boolean }) {
    const canUnlock = totalStars >= (floor.minStarsToUnlock || 10);

    return (
        <motion.button
            onClick={onClick}
            whileTap={(!floor.isLocked || canUnlock) ? { scale: 0.98 } : {}}
            className={`w-full relative h-32 md:h-36 rounded-[2rem] border-b-8 transition-all duration-200 overflow-hidden
                ${floor.isLocked
                    ? 'bg-purple-100 border-purple-200'
                    : 'bg-gradient-to-br from-yellow-100 to-purple-100 border-purple-300 shadow-xl'
                }
            `}
        >
             {/* Decorative Background Patterns */}
             {!floor.isLocked && (
                 <div className="absolute inset-0 opacity-10">
                     <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                     <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-400 rounded-full blur-3xl transform -translate-x-10 translate-y-10"></div>
                 </div>
             )}

             <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                 {floor.isLocked ? (
                     <div className="flex flex-col items-center gap-2">
                         <div className="relative">
                             <Lock className="w-10 h-10 text-purple-300" />
                             {canUnlock && (
                                 <motion.div
                                    className="absolute inset-0"
                                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                 >
                                     <Sparkles className="w-10 h-10 text-yellow-400 absolute top-0 left-0" />
                                 </motion.div>
                             )}
                         </div>
                         <div className="text-purple-400 font-bold text-sm bg-white/50 px-3 py-1 rounded-full">
                             {canUnlock ? "Tap to Unlock!" : `${totalStars}/${floor.minStarsToUnlock} Stars`}
                         </div>
                     </div>
                 ) : (
                     <>
                        <div className="text-purple-600 font-black text-2xl tracking-wider mb-1">BOSS</div>
                        <div className="text-sm font-medium text-purple-800/60 mb-2">{floor.subLabel}</div>
                        <div className="flex gap-1">
                             {[...Array(floor.maxStars)].map((_, i) => (
                                 <StarIcon key={i} filled={i < floor.stars} isShiny={floor.stars === floor.maxStars} size={6} />
                             ))}
                        </div>
                     </>
                 )}
             </div>
        </motion.button>
    )
}

function StarIcon({ filled, isShiny, size = 5 }: { filled: boolean; isShiny: boolean, size?: number }) {
    const sizeClass = size === 6 ? 'w-6 h-6' : 'w-5 h-5';

    return (
        <div className="relative">
            <Star
                className={`${sizeClass} ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-100'}`}
            />
            {filled && isShiny && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ rotate: [0, 90, 180, 270, 360], scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                    <Sparkles className="w-full h-full text-white opacity-60" />
                </motion.div>
            )}
        </div>
    )
}
