"use client";

import { motion } from "framer-motion";

interface MascotProps {
  size?: "sm" | "md" | "lg";
  emotion?: "happy" | "excited" | "thinking" | "sad";
  className?: string;
}

export function Mascot({
  size = "md",
  emotion = "happy",
  className = "",
}: MascotProps) {
  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-32 h-32",
    lg: "w-48 h-48",
  };

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} ${className}`}
      animate={{
        y: [0, -10, 0],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Body */}
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Shadow */}
        <ellipse cx="50" cy="95" rx="25" ry="5" fill="rgba(0,0,0,0.1)" />

        {/* Main body - cute dragon */}
        <ellipse cx="50" cy="55" rx="35" ry="32" fill="#4ADE80" />

        {/* Belly */}
        <ellipse cx="50" cy="60" rx="22" ry="20" fill="#86EFAC" />

        {/* Head */}
        <circle cx="50" cy="30" r="25" fill="#4ADE80" />

        {/* Ears/Horns */}
        <ellipse
          cx="32"
          cy="12"
          rx="6"
          ry="10"
          fill="#FB923C"
          transform="rotate(-20 32 12)"
        />
        <ellipse
          cx="68"
          cy="12"
          rx="6"
          ry="10"
          fill="#FB923C"
          transform="rotate(20 68 12)"
        />

        {/* Eyes */}
        <circle cx="40" cy="28" r="8" fill="white" />
        <circle cx="60" cy="28" r="8" fill="white" />
        <motion.circle
          cx={
            emotion === "thinking" ? "38" : emotion === "sad" ? "41" : "42"
          }
          cy="28"
          r="5"
          fill="#1E293B"
          animate={emotion === "excited" ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        <motion.circle
          cx={
            emotion === "thinking" ? "58" : emotion === "sad" ? "59" : "62"
          }
          cy="28"
          r="5"
          fill="#1E293B"
          animate={emotion === "excited" ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />

        {/* Eye sparkles */}
        <circle cx="44" cy="26" r="2" fill="white" />
        <circle cx="64" cy="26" r="2" fill="white" />

        {/* Cheeks */}
        <circle cx="30" cy="35" r="5" fill="#FDBA74" opacity="0.6" />
        <circle cx="70" cy="35" r="5" fill="#FDBA74" opacity="0.6" />

        {/* Mouth */}
        {emotion === "happy" && (
          <path
            d="M 42 40 Q 50 48 58 40"
            stroke="#1E293B"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {emotion === "excited" && (
          <ellipse cx="50" cy="42" rx="8" ry="6" fill="#1E293B" />
        )}
        {emotion === "thinking" && (
          <circle cx="55" cy="42" r="3" fill="#1E293B" />
        )}
        {emotion === "sad" && (
          <path
            d="M 42 46 Q 50 38 58 46"
            stroke="#1E293B"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Tiny wings */}
        <ellipse cx="18" cy="50" rx="8" ry="12" fill="#86EFAC" />
        <ellipse cx="82" cy="50" rx="8" ry="12" fill="#86EFAC" />

        {/* Feet */}
        <ellipse cx="38" cy="85" rx="8" ry="5" fill="#4ADE80" />
        <ellipse cx="62" cy="85" rx="8" ry="5" fill="#4ADE80" />

        {/* Tail */}
        <path
          d="M 80 70 Q 95 75 90 60 Q 85 50 95 45"
          stroke="#4ADE80"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="95" cy="45" r="5" fill="#FB923C" />
      </svg>
    </motion.div>
  );
}
