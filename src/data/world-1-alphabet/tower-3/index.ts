import { Floor } from "../map-structure";
import {
  createGameFloor,
  createLetterLearningFloor,
  createVocabularyLearningFloor,
} from "../floor-templates";
import { floor1Lessons } from "./floor-1";
import { floor2Lessons } from "./floor-2";
import { floor3Lessons } from "./floor-3";
import { floor4Lessons } from "./floor-4";

export const tower3Floors: Floor[] = [
  createLetterLearningFloor({
    variant: "primary",
    id: 1,
    nameUnlocked: "Chữ b",
    descriptionUnlocked: "Giới thiệu chữ cái b",
    letter: "b",
    maxStars: 3,
    content: floor1Lessons,
  }),
  createLetterLearningFloor({
    variant: "secondary",
    id: 2,
    nameUnlocked: "Chữ ô",
    descriptionUnlocked: "Giới thiệu chữ cái ô",
    letter: "ô",
    maxStars: 3,
    content: floor2Lessons,
  }),
  createVocabularyLearningFloor({
    id: 3,
    nameUnlocked: "Từ vựng",
    descriptionUnlocked: "Ghép từ, luyện nói và viết",
    letter: "b",
    selectionIcon: "boos-svg",
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
