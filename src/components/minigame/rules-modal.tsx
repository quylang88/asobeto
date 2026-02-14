"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface MiniGameRulesModalProps {
  open: boolean;
  title?: string;
  rules: string[];
  onClose: () => void;
}

export function MiniGameRulesModal({
  open,
  title = "Luật chơi",
  rules,
  onClose,
}: MiniGameRulesModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="mini-game-rules-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 px-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 10, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-md overflow-hidden rounded-[1.9rem] border-4 border-emerald-200 bg-white shadow-[0_18px_54px_rgba(16,185,129,0.28)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-200/65 blur-xl" />
            <div className="pointer-events-none absolute -left-8 bottom-4 h-24 w-24 rounded-full bg-cyan-200/60 blur-lg" />

            <div className="relative border-b-2 border-emerald-100 bg-linear-to-r from-emerald-50 via-lime-50 to-cyan-50 px-5 pb-4 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[2rem] leading-none text-slate-800 [font-family:var(--font-mali),sans-serif]">
                  {title}
                </h3>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-emerald-700 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Mini game
                  </span>
                </div>
              </div>
            </div>

            <div className="relative px-5 py-4">
              <ul className="space-y-2.5 text-[0.95rem] leading-snug text-slate-700">
                {rules.map((rule, index) => (
                  <li
                    key={`mini-game-rule-${index}`}
                    className="flex items-start gap-2"
                  >
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
