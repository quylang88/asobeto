import { LessonContent, WordToken } from "../map-structure";
import {
  createVocabListenLookLesson,
  createVocabListenRepeatLesson,
  createVocabTracePracticeLesson,
  createVocabWordBuildLesson,
} from "../../lesson-templates/vocab";

const lessonPrefix = "t4-f3";
const word = "bò";
const wordAssetKey = "bo";
const wordTokens: WordToken[] = [
  { id: "b", text: "b", kind: "letter" },
  { id: "o", text: "o", kind: "letter" },
  { id: "tone-huyen", text: "dấu huyền", kind: "tone" },
];
const wordTokenPool: WordToken[] = [
  { id: "b", text: "b", kind: "letter" },
  { id: "o", text: "o", kind: "letter" },
  { id: "tone-huyen", text: "dấu huyền", kind: "tone" },
  { id: "m", text: "m", kind: "letter" },
  { id: "e", text: "e", kind: "letter" },
];
const reviewLetters = ["O", "B", "E", "M"];

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
