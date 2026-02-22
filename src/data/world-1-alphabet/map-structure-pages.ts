import type { Tower, TowerConnection } from "./types";
import { tower1Floors } from "./tower-1";
import { towerBossFloors } from "./tower-boss";

const WORLD1_PAGE_CONNECTIONS: TowerConnection[] = [
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 4 },
  { from: 3, to: 5 },
  { from: 4, to: 6 },
  { from: 5, to: 6 },
];

interface TowerSeed {
  id: number;
  name: string;
  letters: string;
  stars: number;
  completed: boolean;
  unlocked: boolean;
}

const WORLD1_LAYOUT = [
  { id: 1, x: 50, y: 15, parentIds: [] as number[] },
  { id: 2, x: 25, y: 38, parentIds: [1] },
  { id: 3, x: 75, y: 38, parentIds: [1] },
  { id: 4, x: 25, y: 62, parentIds: [2] },
  { id: 5, x: 75, y: 62, parentIds: [3] },
  { id: 6, x: 50, y: 85, parentIds: [4, 5] },
];

function createWorld1BookPageTowers(
  regularSeeds: TowerSeed[],
  bossSeed: TowerSeed,
): Tower[] {
  return WORLD1_LAYOUT.map((node) => {
    const seed = node.id === 6 ? bossSeed : regularSeeds[node.id - 1];
    const isBoss = node.id === 6;

    return {
      id: node.id,
      name: seed.name,
      letters: seed.letters,
      stars: seed.stars,
      maxStars: isBoss ? 2 : 12,
      completed: seed.completed,
      unlocked: seed.unlocked,
      position: { x: node.x, y: node.y },
      parentIds: node.parentIds,
      isBoss,
      floors: isBoss ? towerBossFloors : tower1Floors,
    };
  });
}

const page2RegularSeeds: TowerSeed[] = [
  {
    id: 1,
    name: "á",
    letters: "á, à",
    stars: 3,
    completed: true,
    unlocked: true,
  },
  {
    id: 2,
    name: "ả",
    letters: "ả, ã",
    stars: 2,
    completed: true,
    unlocked: true,
  },
  {
    id: 3,
    name: "ạ",
    letters: "ạ, â",
    stars: 3,
    completed: true,
    unlocked: true,
  },
  {
    id: 4,
    name: "ê",
    letters: "ê, ô",
    stars: 0,
    completed: false,
    unlocked: true,
  },
  {
    id: 5,
    name: "ơ",
    letters: "ơ, ư",
    stars: 0,
    completed: false,
    unlocked: true,
  },
];

const page3RegularSeeds: TowerSeed[] = [
  {
    id: 1,
    name: "an",
    letters: "an, am",
    stars: 3,
    completed: true,
    unlocked: true,
  },
  {
    id: 2,
    name: "at",
    letters: "at, ac",
    stars: 2,
    completed: true,
    unlocked: true,
  },
  {
    id: 3,
    name: "on",
    letters: "on, om",
    stars: 3,
    completed: true,
    unlocked: true,
  },
  {
    id: 4,
    name: "ot",
    letters: "ot, oc",
    stars: 0,
    completed: false,
    unlocked: true,
  },
  {
    id: 5,
    name: "en",
    letters: "en, em",
    stars: 0,
    completed: false,
    unlocked: true,
  },
];

const sharedBossSeed: TowerSeed = {
  id: 6,
  name: "BOSS",
  letters: "Thử Thách",
  stars: 0,
  completed: false,
  unlocked: false,
};

export const world1Page2Towers: Tower[] = createWorld1BookPageTowers(
  page2RegularSeeds,
  sharedBossSeed,
);
export const world1Page3Towers: Tower[] = createWorld1BookPageTowers(
  page3RegularSeeds,
  sharedBossSeed,
);
export const world1PageTowerConnections: TowerConnection[] =
  WORLD1_PAGE_CONNECTIONS;
