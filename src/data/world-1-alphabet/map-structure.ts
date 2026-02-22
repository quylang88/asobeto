import type { Tower, TowerConnection } from "./types";
import { tower1Floors } from "./tower-1";
import { tower2Floors } from "./tower-2";
import { tower3Floors } from "./tower-3";
import { tower4Floors } from "./tower-4";
import { tower5Floors } from "./tower-5";
import { towerBossFloors } from "./tower-boss";

// Cấu trúc cây tháp:
//          T1 (gốc)
//         /  \
//       T2    T3
//       |      |
//      T4     T5
//        \   /
//       Tháp Boss

export const towers: Tower[] = [
  {
    id: 1,
    name: "a",
    letters: "a, c",
    stars: 3,
    maxStars: 12,
    completed: true,
    unlocked: true,
    position: { x: 50, y: 15 },
    parentIds: [],
    floors: tower1Floors,
  },
  {
    id: 2,
    name: "ă",
    letters: "ă, n",
    stars: 2,
    maxStars: 12,
    completed: true,
    unlocked: true,
    position: { x: 25, y: 38 },
    parentIds: [1],
    floors: tower2Floors,
  },
  {
    id: 3,
    name: "ô",
    letters: "ô, b",
    stars: 3,
    maxStars: 12,
    completed: true,
    unlocked: true,
    position: { x: 75, y: 38 },
    parentIds: [1],
    floors: tower3Floors,
  },
  {
    id: 4,
    name: "o",
    letters: "o",
    stars: 0,
    maxStars: 12,
    completed: false,
    unlocked: true,
    position: { x: 25, y: 62 },
    parentIds: [2],
    floors: tower4Floors,
  },
  {
    id: 5,
    name: "e",
    letters: "e, m",
    stars: 0,
    maxStars: 12,
    completed: false,
    unlocked: true,
    position: { x: 75, y: 62 },
    parentIds: [3],
    floors: tower5Floors,
  },
  {
    id: 6,
    name: "BOSS",
    letters: "Thử Thách",
    stars: 0,
    maxStars: 2,
    completed: false,
    unlocked: false,
    position: { x: 50, y: 85 },
    parentIds: [4, 5],
    isBoss: true,
    floors: towerBossFloors,
  },
];

// Định nghĩa các kết nối giữa các tháp
export const towerConnections: TowerConnection[] = [
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 4 },
  { from: 3, to: 5 },
  { from: 4, to: 6 },
  { from: 5, to: 6 },
];
