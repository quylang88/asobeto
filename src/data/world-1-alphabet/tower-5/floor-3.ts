import { LessonContent, WordToken } from "../map-structure";
import {
  createVocabListenLookLesson,
  createVocabListenRepeatLesson,
  createVocabTracePracticeLesson,
  createVocabWordBuildLesson,
} from "../../lesson-templates/vocab";

const lessonPrefix = "t5-f3";
const word = "mẹ";
const wordAssetKey = "mej";
const wordTokens: WordToken[] = [
  { id: "m", text: "m", kind: "letter" },
  { id: "e", text: "e", kind: "letter" },
  { id: "tone-nang", text: "dấu nặng", kind: "tone" },
];
const wordTokenPool: WordToken[] = [
  { id: "m", text: "m", kind: "letter" },
  { id: "e", text: "e", kind: "letter" },
  { id: "tone-nang", text: "dấu nặng", kind: "tone" },
  { id: "o", text: "o", kind: "letter" },
  { id: "b", text: "b", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
];
const reviewLetters = ["m", "e", "o"];

export const floor3Lessons: LessonContent[] = [
  createVocabListenLookLesson({
    lessonId: `${lessonPrefix}-l1`,
    word,
    wordAssetKey,
    reviewLetters,
  }),
  createVocabListenRepeatLesson({
    lessonId: `${lessonPrefix}-l2`,
    word,
    wordAssetKey,
    reviewLetters,
  }),
  createVocabWordBuildLesson({
    lessonId: `${lessonPrefix}-l3`,
    word,
    wordAssetKey,
    wordTokens,
    wordTokenPool,
    reviewLetters,
  }),
  createVocabTracePracticeLesson({
    lessonId: `${lessonPrefix}-l4`,
    word,
    wordAssetKey,
    reviewLetters,
  }),
];
