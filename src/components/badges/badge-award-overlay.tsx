"use client";

import { motion } from "framer-motion";
import type { TowerBadgeRecord } from "@/lib/tower-badges";
import { TowerBadgeSticker } from "./badge-sticker";

interface TowerBadgeAwardOverlayProps {
  badge: TowerBadgeRecord;
  onDismiss: () => void;
  mode?: "unlock" | "preview";
}

export function TowerBadgeAwardOverlay({
  badge,
  onDismiss,
  mode = "unlock",
}: TowerBadgeAwardOverlayProps) {
  const isPreviewMode = mode === "preview";

  return (
    <motion.button
      type="button"
      onClick={onDismiss}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/52 backdrop-blur-sm"
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

        <TowerBadgeSticker
          badge={badge}
          size="lg"
          highlight
          variant={isPreviewMode ? "badgeOnly" : "framed"}
        />

        {!isPreviewMode && (
          <motion.p
            className="relative rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-slate-800 shadow-lg"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            Bé nhận được huy hiệu mới!
          </motion.p>
        )}
      </motion.div>
    </motion.button>
  );
}
