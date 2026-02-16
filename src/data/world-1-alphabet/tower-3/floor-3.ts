import { LessonContent, WordToken } from "../map-structure";
import {
  createVocabListenLookLesson,
  createVocabPronunciationPracticeLesson,
  createVocabTracePracticeLesson,
  createVocabWordBuildLesson,
} from "../../lesson-templates/vocab";

const lessonPrefix = "t3-f3";
const word = "bố";
const wordAssetKey = "boos";
const wordTokens: WordToken[] = [
  { id: "b", text: "b", kind: "letter" },
  { id: "oo", text: "ô", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
];
const wordTokenPool: WordToken[] = [
  { id: "b", text: "b", kind: "letter" },
  { id: "oo", text: "ô", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
  { id: "o", text: "o", kind: "letter" },
  { id: "tone-huyen", text: "dấu huyền", kind: "tone" },
];
const reviewLetters = ["ô", "b", "o"];

export const floor3Lessons: LessonContent[] = [
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
