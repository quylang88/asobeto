"use client";

import { motion } from "framer-motion";
import { Mascot } from "../components/beto-mascot";
import { Volume2 } from "lucide-react";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="relative h-screen overflow-hidden bg-linear-to-b from-blue-soft via-green-bright/20 to-orange-bright/30 pt-safe pb-safe">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating clouds */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/80 rounded-full"
            style={{
              width: 60 + i * 30,
              height: 30 + i * 15,
              left: `${i * 20}%`,
              top: `${10 + i * 8}%`,
            }}
            animate={{
              x: [0, 30, 0],
              opacity: [0.6, 0.9, 0.6],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}

        {/* Floating stars */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute text-yellow-bright text-2xl"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, 20, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Mascot */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 1 }}
        >
          <Mascot size="lg" emotion="excited" />
        </motion.div>

        {/* Title */}
        <motion.h1
          className="mt-6 text-6xl md:text-8xl font-bold text-foreground tracking-tight"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{
            textShadow:
              "4px 4px 0px rgba(251, 146, 60, 0.5), 8px 8px 0px rgba(74, 222, 128, 0.3)",
          }}
        >
          <span className="text-green-bright">Aso</span>
          <span className="text-orange-bright">be</span>
          <span className="text-blue-soft">to</span>
        </motion.h1>

        <motion.p
          className="mt-4 text-xl md:text-2xl text-foreground/80 font-semibold"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Learn Vietnamese with Fun!
        </motion.p>

        {/* Start Button */}
        <motion.button
          onClick={onStart}
          className="mt-12 relative group ios-button"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 bg-orange-bright rounded-3xl translate-y-2 transition-transform" />
          <div className="relative bg-green-bright text-white text-3xl md:text-4xl font-bold px-16 py-6 rounded-3xl shadow-lg">
            START
          </div>
        </motion.button>

        {/* Sound toggle */}
        <motion.button
          className="absolute top-6 right-6 p-4 bg-white/90 rounded-full shadow-lg ios-button mt-safe mr-safe"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Volume2 className="w-6 h-6 text-green-bright" />
        </motion.button>
      </div>

      {/* Bottom grass decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-green-bright/30 rounded-t-[100%]" />
    </div>
  );
}
