"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface SparkleStarsProps {
  stars: number;
  maxStars: number;
  size?: "sm" | "md" | "lg";
}

export function SparkleStars({
  stars,
  maxStars,
  size = "md",
}: SparkleStarsProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const isPerfect = stars === maxStars && maxStars === 4;

  return (
    <div className="flex gap-1">
      {[...Array(maxStars)].map((_, i) => (
        <motion.div
          key={i}
          initial={false}
          animate={
            isPerfect
              ? {
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }
              : {}
          }
          transition={
            isPerfect
              ? {
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1,
                }
              : {}
          }
        >
          <motion.div
            animate={
              isPerfect
                ? {
                    filter: [
                      "drop-shadow(0 0 0px rgba(250, 204, 21, 0))",
                      "drop-shadow(0 0 8px rgba(250, 204, 21, 0.8))",
                      "drop-shadow(0 0 0px rgba(250, 204, 21, 0))",
                    ],
                  }
                : {}
            }
            transition={
              isPerfect
                ? {
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }
                : {}
            }
          >
            <Star
              className={`${sizeClasses[size]} ${
                i < stars
                  ? "text-yellow-bright fill-yellow-bright"
                  : "text-gray-300 fill-gray-200"
              }`}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
