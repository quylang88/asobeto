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

export const page3Tower3Floors: Floor[] = [
  createLetterLearningFloor({
    variant: "primary",
    id: 1,
    nameUnlocked: "Chữ đ",
    descriptionUnlocked: "Giới thiệu chữ cái",
    letter: "đ",
    maxStars: 3,
    content: floor1Lessons,
  }),
  createVocabularyLearningFloor({
    id: 2,
    nameUnlocked: "Từ vựng",
    descriptionUnlocked: "Ghép từ, luyện nói và viết",
    letter: "đ",
    maxStars: 3,
    content: floor2Lessons,
  }),
  createLetterLearningFloor({
    variant: "secondary",
    id: 3,
    nameUnlocked: "Chữ x",
    descriptionUnlocked: "Giới thiệu chữ cái",
    letter: "x",
    maxStars: 3,
    content: floor3Lessons,
  }),
  createVocabularyLearningFloor({
    id: 4,
    nameUnlocked: "Từ vựng",
    descriptionUnlocked: "Ghép từ, luyện nói và viết",
    letter: "x",
    maxStars: 3,
    content: floor4Lessons,
  }),
];

export const page3Tower3Seed: TowerSeed = {
  id: 3,
  name: "đ",
  letters: "đ, đá, x, xe",
  stars: 3,
  completed: true,
  unlocked: true,
  floors: page3Tower3Floors,
};
