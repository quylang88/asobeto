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

export const page2Tower4Floors: Floor[] = [
  createLetterLearningFloor({
    variant: "primary",
    id: 1,
    nameUnlocked: "Chữ ư",
    descriptionUnlocked: "Giới thiệu chữ cái",
    letter: "ư",
    maxStars: 3,
    content: floor1Lessons,
  }),
  createLetterLearningFloor({
    variant: "secondary",
    id: 2,
    nameUnlocked: "Chữ t",
    descriptionUnlocked: "Giới thiệu chữ cái",
    letter: "t",
    maxStars: 3,
    content: floor2Lessons,
  }),
  createVocabularyLearningFloor({
    id: 3,
    nameUnlocked: "Từ vựng",
    descriptionUnlocked: "Ghép từ, luyện nói và viết",
    letter: "s",
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

export const page2Tower4Seed: TowerSeed = {
  id: 4,
  name: "ư",
  letters: "ư, t, sư tử",
  stars: 0,
  completed: false,
  unlocked: true,
  floors: page2Tower4Floors,
};
