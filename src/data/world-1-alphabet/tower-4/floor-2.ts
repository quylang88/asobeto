import type { LessonContent, WordToken } from "../types";
import {
  createVocabListenLookLesson,
  createVocabPronunciationPracticeLesson,
  createVocabTracePracticeLesson,
  createVocabWordBuildLesson,
} from "../../lesson-templates/vocab";

const lessonPrefix = "t4-f2";
const word = "cỏ";
const wordAssetKey = "cor";
const wordTokens: WordToken[] = [
  { id: "c", text: "c", kind: "letter" },
  { id: "o", text: "o", kind: "letter" },
  { id: "tone-hoi", text: "dấu hỏi", kind: "tone" },
];
const wordTokenPool: WordToken[] = [
  { id: "c", text: "c", kind: "letter" },
  { id: "o", text: "o", kind: "letter" },
  { id: "tone-hoi", text: "dấu hỏi", kind: "tone" },
  { id: "b", text: "b", kind: "letter" },
  { id: "tone-huyen", text: "dấu huyền", kind: "tone" },
];
const reviewLetters = ["o", "c", "b"];

export const floor2Lessons: LessonContent[] = [
  createVocabListenLookLesson({
    lessonId: `${lessonPrefix}-l1`,
    word,
    wordAssetKey,
    reviewLetters,
  }),
  createVocabPronunciationPracticeLesson({
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
