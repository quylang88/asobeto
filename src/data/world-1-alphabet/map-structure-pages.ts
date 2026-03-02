import type { Tower, TowerConnection } from "./types";
import type { TowerSeed } from "./page-seed-types";
import { page2RegularSeeds } from "./page-2";
import { page3RegularSeeds } from "./page-3";
import { tower1Floors } from "./page-1/tower-1";
import { towerBossFloors } from "./page-1/tower-boss";

const WORLD1_PAGE_CONNECTIONS: TowerConnection[] = [
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 4 },
  { from: 3, to: 5 },
  { from: 4, to: 6 },
  { from: 5, to: 6 },
];

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
      floors: isBoss ? towerBossFloors : seed.floors ?? tower1Floors,
    };
  });
}

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
