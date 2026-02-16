import { Floor } from "../map-structure";
import { createGameFloor } from "../floor-templates";
import { floor1Lessons } from "./floor-1";
import { floor2Lessons } from "./floor-2";

export const towerBossFloors: Floor[] = [
  createGameFloor({
    id: 1,
    nameUnlocked: "Ôn tập BOSS",
    descriptionUnlocked: "10 bài ôn tập tổng hợp",
    letter: "?",
    maxStars: 10,
    content: floor1Lessons,
  }),
  createGameFloor({
    id: 2,
    nameUnlocked: "Game Bí Ẩn",
    nameLocked: "Game Bí Ẩn",
    descriptionUnlocked: "Mini game BOSS (placeholder)",
    descriptionLocked: "Đạt tối thiểu 6/10 bài ôn tập để mở khóa.",
    letter: "!",
    maxStars: 6,
    unlocked: false,
    content: floor2Lessons,
  }),
];
