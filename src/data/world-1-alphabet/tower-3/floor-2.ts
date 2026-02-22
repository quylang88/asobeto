import type { LessonContent } from "../types";
import {
  createLetterListenLesson,
  createLetterQuizLesson,
  createLetterTraceDemoLesson,
  createLetterTracePracticeLesson,
} from "../../lesson-templates/letter";

const lessonPrefix = "t3-f2";
const letter = "ô";
const letterAssetKey = "oo";
const distractors: [string, string] = ["o", "ơ"];

export const floor2Lessons: LessonContent[] = [
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
