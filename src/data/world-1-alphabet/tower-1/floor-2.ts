import type { LessonContent } from "../types";
import {
  createLetterListenLesson,
  createLetterQuizLesson,
  createLetterTraceDemoLesson,
  createLetterTracePracticeLesson,
} from "../../lesson-templates/letter";

const lessonPrefix = "t1-f2";
const letter = "c";
const letterAssetKey = "c";
const distractors: [string, string] = ["a", "b"];

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
