import { LessonContent } from "../map-structure";
import {
  createLetterListenLesson,
  createLetterQuizLesson,
  createLetterTraceDemoLesson,
  createLetterTracePracticeLesson,
} from "../../lesson-templates/letter";

const lessonPrefix = "t2-f1";
const letter = "ă";
const letterAssetKey = "aw";
const distractors: [string, string] = ["a", "â"];

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
