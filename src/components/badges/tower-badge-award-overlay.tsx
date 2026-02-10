"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { TowerBadgeRecord } from "@/lib/tower-badges";
import { TowerBadgeSticker } from "./tower-badge-sticker";

interface TowerBadgeAwardOverlayProps {
  badge: TowerBadgeRecord;
  onDismiss: () => void;
}

export function TowerBadgeAwardOverlay({
  badge,
  onDismiss,
}: TowerBadgeAwardOverlayProps) {
  return (
    <motion.button
      type="button"
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/52 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative flex flex-col items-center gap-3 px-6 text-center"
        initial={{ scale: 0.82, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 12 }}
        transition={{ type: "spring", damping: 17, stiffness: 240 }}
      >
        <motion.div
          className="pointer-events-none absolute -inset-6 rounded-full bg-yellow-300/25 blur-3xl"
          animate={{ opacity: [0.35, 0.8, 0.35], scale: [0.95, 1.06, 0.95] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />

        <TowerBadgeSticker badge={badge} size="lg" highlight />

        <motion.p
          className="relative flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-slate-800 shadow-lg"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          Bé nhận được huy hiệu mới!
        </motion.p>

        <p className="relative text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">
          Chạm vào màn hình để tiếp tục
        </p>
      </motion.div>
    </motion.button>
  );
}
