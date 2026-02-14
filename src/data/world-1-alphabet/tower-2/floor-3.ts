import { LessonContent, WordToken } from "../map-structure";
import {
  createVocabListenLookLesson,
  createVocabListenRepeatLesson,
  createVocabTracePracticeLesson,
  createVocabWordBuildLesson,
} from "../../lesson-templates/vocab";

const lessonPrefix = "t2-f3";
const word = "ăn";
const wordAssetKey = "awn";
const wordTokens: WordToken[] = [
  { id: "aw", text: "ă", kind: "letter" },
  { id: "n", text: "n", kind: "letter" },
];
const wordTokenPool: WordToken[] = [
  { id: "aw", text: "ă", kind: "letter" },
  { id: "n", text: "n", kind: "letter" },
  { id: "a", text: "a", kind: "letter" },
  { id: "c", text: "c", kind: "letter" },
  { id: "m", text: "m", kind: "letter" },
];
const reviewLetters = ["ă", "n", "a", "c"];

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
