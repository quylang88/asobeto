import { LessonContent, WordToken } from "../map-structure";
import {
  createVocabListenLookLesson,
  createVocabListenRepeatLesson,
  createVocabTracePracticeLesson,
  createVocabWordBuildLesson,
} from "../../lesson-templates/vocab";

const lessonPrefix = "t1-f3";
const word = "cá";
const wordAssetKey = "cas";
const wordTokens: WordToken[] = [
  { id: "c", text: "c", kind: "letter" },
  { id: "a", text: "a", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
];
const wordTokenPool: WordToken[] = [
  { id: "c", text: "c", kind: "letter" },
  { id: "a", text: "a", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
  { id: "n", text: "n", kind: "letter" },
  { id: "o", text: "o", kind: "letter" },
];
const reviewLetters = ["A", "C"];

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
