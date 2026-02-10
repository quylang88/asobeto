"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Medal, X } from "lucide-react";
import type { TowerBadgeRecord } from "@/lib/tower-badges";
import { TowerBadgeAwardOverlay } from "./badge-award-overlay";
import { TowerBadgeSticker } from "./badge-sticker";

interface TowerBadgeCollectionModalProps {
  badges: TowerBadgeRecord[];
  onClose: () => void;
}

export function TowerBadgeCollectionModal({
  badges,
  onClose,
}: TowerBadgeCollectionModalProps) {
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;
  const [focusedBadge, setFocusedBadge] = useState<TowerBadgeRecord | null>(null);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          className="relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-4xl border-4 border-emerald-200 bg-white shadow-2xl"
          initial={{ y: 24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 24, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", damping: 22, stiffness: 260 }}
        >
          <div className="relative border-b-2 border-emerald-100 bg-linear-to-r from-emerald-50 via-lime-50 to-teal-50 px-5 pb-4 pt-5">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-xl bg-emerald-100 p-2 text-emerald-700 ios-button"
              aria-label="Đóng bộ sưu tập huy hiệu"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-3xl font-hp-special font-black text-emerald-900">
              Bộ sưu tập huy hiệu
            </h2>
            <p className="mt-1 flex items-center gap-1 text-sm text-emerald-800">
              <Medal className="h-4 w-4 text-emerald-600" />
              {unlockedCount} huy hiệu đã sưu tầm
            </p>
          </div>

          <div className="app-scroll flex-1 overflow-y-auto px-3 py-3">
            {badges.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {badges.map((badge) => (
                  <motion.button
                    key={badge.key}
                    type="button"
                    onClick={() => setFocusedBadge(badge)}
                    aria-label={`Xem huy hiệu ${badge.towerName}`}
                    className="flex items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50/70 p-1 ios-button"
                    whileTap={{ scale: 0.96 }}
                  >
                    <TowerBadgeSticker badge={badge} size="sm" />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                Chưa có dữ liệu huy hiệu.
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {focusedBadge && (
          <TowerBadgeAwardOverlay
            badge={focusedBadge}
            mode="preview"
            onDismiss={() => setFocusedBadge(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
