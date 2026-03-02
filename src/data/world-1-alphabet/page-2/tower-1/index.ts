import type { Floor } from "../../types";
import type { TowerSeed } from "../../page-seed-types";
import {
  createGameFloor,
  createLetterLearningFloor,
  createVocabularyLearningFloor,
} from "../../floor-templates";
import { floor1Lessons } from "./floor-1";
import { floor2Lessons } from "./floor-2";
import { floor3Lessons } from "./floor-3";
import { floor4Lessons } from "./floor-4";

export const page2Tower1Floors: Floor[] = [
  createLetterLearningFloor({
    variant: "primary",
    id: 1,
    nameUnlocked: "Chữ u",
    descriptionUnlocked: "Giới thiệu chữ cái",
    letter: "u",
    maxStars: 3,
    content: floor1Lessons,
  }),
  createLetterLearningFloor({
    variant: "secondary",
    id: 2,
    nameUnlocked: "Chữ q",
    descriptionUnlocked: "Giới thiệu chữ cái",
    letter: "q",
    maxStars: 3,
    content: floor2Lessons,
  }),
  createVocabularyLearningFloor({
    id: 3,
    nameUnlocked: "Từ vựng",
    descriptionUnlocked: "Ghép từ, luyện nói và viết",
    letter: "m",
    maxStars: 3,
    content: floor3Lessons,
  }),
  createGameFloor({
    id: 4,
    nameUnlocked: "Bóng bay chữ",
    descriptionUnlocked: "Mini game",
    letter: "?",
    maxStars: 6,
    content: floor4Lessons,
  }),
];

export const page2Tower1Seed: TowerSeed = {
  id: 1,
  name: "u",
  letters: "u, q, mũ",
  stars: 3,
  completed: true,
  unlocked: true,
  floors: page2Tower1Floors,
};
