import type { Floor } from "./types";

export interface TowerSeed {
  id: number;
  name: string;
  letters: string;
  stars: number;
  completed: boolean;
  unlocked: boolean;
  floors?: Floor[];
}
