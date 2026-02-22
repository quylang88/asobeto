import type { LessonContent } from "../types";
import {
  createLetterListenLesson,
  createLetterQuizLesson,
  createLetterTraceDemoLesson,
  createLetterTracePracticeLesson,
} from "../../lesson-templates/letter";

const lessonPrefix = "t4-f1";
const letter = "o";
const letterAssetKey = "o";
const distractors: [string, string] = ["ô", "a"];

export const floor1Lessons: LessonContent[] = [
  createLetterListenLesson({
    lessonId: `${lessonPrefix}-l1`,
    letter,
    letterAssetKey,
  }),
  createLetterQuizLesson({
    lessonId: `${lessonPrefix}-l2`,
    letter,
    letterAssetKey,
    distractors,
  }),
  createLetterTraceDemoLesson({
    lessonId: `${lessonPrefix}-l3`,
    letter,
    letterAssetKey,
  }),
  createLetterTracePracticeLesson({
    lessonId: `${lessonPrefix}-l4`,
    letter,
    letterAssetKey,
  }),
];
