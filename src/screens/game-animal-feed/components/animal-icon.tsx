"use client";

import { BofSvg } from "@/screens/floor-selection/components/bof-svg";

export type FeedAnimalMood = "idle" | "open" | "chew" | "sad";

interface FeedAnimalIconProps {
  animalIconId: string;
  mood: FeedAnimalMood;
}

export function FeedAnimalIcon({ animalIconId, mood }: FeedAnimalIconProps) {
  if (animalIconId === "bof") {
    return <BofSvg mood={mood} />;
  }

  return <BofSvg mood={mood} />;
}

