import type { Floor } from "../../types";
import { createGameFloor } from "../../floor-templates";
import { floor1Lessons } from "./floor-1";
import { floor2Lessons } from "./floor-2";
import { getBossReviewRequiredPassCount } from "../../../scoring-config";

const BOSS_REVIEW_TOTAL_LESSONS = floor1Lessons.filter(
  (lesson) => lesson.type === "active",
).length;
const BOSS_REVIEW_REQUIRED_PASS_COUNT = getBossReviewRequiredPassCount(
  BOSS_REVIEW_TOTAL_LESSONS,
);

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
    nameUnlocked: "Vòng quay bí ẩn",
    nameLocked: "Vòng quay bí ẩn",
    descriptionUnlocked: "Vòng quay may mắn của BOSS.",
    descriptionLocked: `Đạt tối thiểu ${BOSS_REVIEW_REQUIRED_PASS_COUNT}/${BOSS_REVIEW_TOTAL_LESSONS} bài ôn tập để mở khóa.`,
    letter: "!",
    maxStars: 10,
    unlocked: false,
    content: floor2Lessons,
  }),
];
