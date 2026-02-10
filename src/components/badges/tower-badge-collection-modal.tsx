"use client";

import { motion } from "framer-motion";
import { Star, X } from "lucide-react";
import type { TowerBadgeRecord } from "@/lib/tower-badges";
import { TowerBadgeSticker } from "./tower-badge-sticker";

interface TowerBadgeCollectionModalProps {
  worldName: string;
  badges: TowerBadgeRecord[];
  onClose: () => void;
}

export function TowerBadgeCollectionModal({
  worldName,
  badges,
  onClose,
}: TowerBadgeCollectionModalProps) {
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  return (
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
        className="relative flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-4xl border-4 border-cyan-200 bg-white shadow-2xl"
        initial={{ y: 24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
      >
        <div className="relative border-b-2 border-cyan-100 bg-linear-to-r from-cyan-50 to-emerald-50 px-5 pb-4 pt-5">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-xl bg-cyan-100 p-2 text-cyan-700 ios-button"
            aria-label="Đóng bộ sưu tập huy hiệu"
          >
            <X className="h-5 w-5" />
          </button>
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-cyan-600">
            Bộ Sưu Tập
          </p>
          <h2 className="mt-1 text-2xl font-hp-special font-black text-slate-900">
            Huy hiệu {worldName}
          </h2>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
            <Star className="h-4 w-4 fill-yellow-300 text-yellow-500" />
            {unlockedCount}/{badges.length} huy hiệu đã sưu tầm
          </p>
        </div>

        <div className="app-scroll flex-1 overflow-y-auto px-4 py-4">
          {badges.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {badges.map((badge) => (
                <div
                  key={badge.key}
                  className="flex flex-col items-center rounded-3xl border border-slate-100 bg-slate-50/70 p-2"
                >
                  <TowerBadgeSticker badge={badge} size="sm" />
                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    Tháp {badge.towerName}
                  </p>
                </div>
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
  );
}
