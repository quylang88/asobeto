import type { Floor } from "../../types";
import type { TowerSeed } from "../../page-seed-types";
import {
  createLetterLearningFloor,
  createVocabularyLearningFloor,
} from "../../floor-templates";
import { floor1Lessons } from "./floor-1";
import { floor2Lessons } from "./floor-2";
import { floor3Lessons } from "./floor-3";
import { floor4Lessons } from "./floor-4";

export const page3Tower2Floors: Floor[] = [
  createLetterLearningFloor({
    variant: "primary",
    id: 1,
    nameUnlocked: "Chữ h",
    descriptionUnlocked: "Giới thiệu chữ cái",
    letter: "h",
    maxStars: 3,
    content: floor1Lessons,
  }),
  createVocabularyLearningFloor({
    id: 2,
    nameUnlocked: "Từ vựng",
    descriptionUnlocked: "Ghép từ, luyện nói và viết",
    letter: "h",
    maxStars: 3,
    content: floor2Lessons,
  }),
  createLetterLearningFloor({
    variant: "secondary",
    id: 3,
    nameUnlocked: "Chữ l",
    descriptionUnlocked: "Giới thiệu chữ cái",
    letter: "l",
    maxStars: 3,
    content: floor3Lessons,
  }),
  createVocabularyLearningFloor({
    id: 4,
    nameUnlocked: "Từ vựng",
    descriptionUnlocked: "Ghép từ, luyện nói và viết",
    letter: "l",
    maxStars: 3,
    content: floor4Lessons,
  }),
];

export const page3Tower2Seed: TowerSeed = {
  id: 2,
  name: "h",
  letters: "h, hổ, l, lợn",
  stars: 2,
  completed: true,
  unlocked: true,
  floors: page3Tower2Floors,
};
