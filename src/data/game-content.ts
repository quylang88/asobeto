// Game content data with tower positions for the branching tree map

export interface TowerPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface Tower {
  id: number;
  name: string;
  letters: string;
  stars: number;
  maxStars: number;
  completed: boolean;
  unlocked: boolean;
  position: TowerPosition;
  parentIds: number[]; // IDs of towers that unlock this one
  isBoss?: boolean;
}

export interface TowerConnection {
  from: number;
  to: number;
}

// Tower tree structure:
//          T1 (root)
//         /  \
//       T2    T3
//       |      |
//      T4     T5
//        \   /
//       Boss Tower

export const towers: Tower[] = [
  {
    id: 1,
    name: "A-D",
    letters: "A, B, C, D",
    stars: 3,
    maxStars: 3,
    completed: true,
    unlocked: true,
    position: { x: 50, y: 8 },
    parentIds: [],
  },
  {
    id: 2,
    name: "E-H",
    letters: "E, F, G, H",
    stars: 2,
    maxStars: 3,
    completed: true,
    unlocked: true,
    position: { x: 25, y: 28 },
    parentIds: [1],
  },
  {
    id: 3,
    name: "I-L",
    letters: "I, K, L",
    stars: 3,
    maxStars: 3,
    completed: true,
    unlocked: true,
    position: { x: 75, y: 28 },
    parentIds: [1],
  },
  {
    id: 4,
    name: "M-P",
    letters: "M, N, O, P",
    stars: 0,
    maxStars: 3,
    completed: false,
    unlocked: true,
    position: { x: 20, y: 50 },
    parentIds: [2],
  },
  {
    id: 5,
    name: "Q-T",
    letters: "Q, R, S, T",
    stars: 0,
    maxStars: 3,
    completed: false,
    unlocked: false,
    position: { x: 80, y: 50 },
    parentIds: [3],
  },
  {
    id: 6,
    name: "BOSS",
    letters: "Grand Challenge",
    stars: 0,
    maxStars: 5,
    completed: false,
    unlocked: false,
    position: { x: 50, y: 78 },
    parentIds: [4, 5],
    isBoss: true,
  },
];

// Define connections between towers
export const towerConnections: TowerConnection[] = [
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 4 },
  { from: 3, to: 5 },
  { from: 4, to: 6 },
  { from: 5, to: 6 },
];

// Calculate total stars earned
export function getTotalStars(towerList: Tower[]): number {
  return towerList.reduce((sum, tower) => sum + tower.stars, 0);
}

// Calculate total possible stars
export function getMaxStars(towerList: Tower[]): number {
  return towerList.reduce((sum, tower) => sum + tower.maxStars, 0);
}

// Check if boss tower can be unlocked
export function canUnlockBoss(
  towerList: Tower[],
  requiredStars: number = 15,
): boolean {
  const regularTowers = towerList.filter((t) => !t.isBoss);
  const allCompleted = regularTowers.every((t) => t.completed);
  const totalStars = getTotalStars(regularTowers);
  return allCompleted && totalStars >= requiredStars;
}

// Check if a tower should be unlocked based on parent completion
export function shouldTowerBeUnlocked(
  tower: Tower,
  allTowers: Tower[],
): boolean {
  if (tower.parentIds.length === 0) return true; // Root tower is always unlocked

  if (tower.isBoss) {
    // Boss requires ALL parents completed
    return tower.parentIds.every((parentId) => {
      const parent = allTowers.find((t) => t.id === parentId);
      return parent?.completed;
    });
  }

  // Regular towers unlock when ANY parent is completed
  return tower.parentIds.some((parentId) => {
    const parent = allTowers.find((t) => t.id === parentId);
    return parent?.completed;
  });
}
