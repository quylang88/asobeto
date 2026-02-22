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

export const page2Tower5Floors: Floor[] = [
  createLetterLearningFloor({
    variant: "primary",
    id: 1,
    nameUnlocked: "Chữ ê",
    descriptionUnlocked: "Giới thiệu chữ cái",
    letter: "ê",
    maxStars: 3,
    content: floor1Lessons,
  }),
  createLetterLearningFloor({
    variant: "secondary",
    id: 2,
    nameUnlocked: "Chữ d",
    descriptionUnlocked: "Giới thiệu chữ cái",
    letter: "d",
    maxStars: 3,
    content: floor2Lessons,
  }),
  createVocabularyLearningFloor({
    id: 3,
    nameUnlocked: "Từ vựng",
    descriptionUnlocked: "Ghép từ, luyện nói và viết",
    letter: "d",
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

export const page2Tower5Seed: TowerSeed = {
  id: 5,
  name: "ê",
  letters: "ê, d, dê",
  stars: 0,
  completed: false,
  unlocked: true,
  floors: page2Tower5Floors,
};
