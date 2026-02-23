import type { LessonContent, WordToken } from "../../types";
import { createVocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "dd", text: "đ", kind: "letter" },
  { id: "a", text: "a", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
];

const wordTokenPool: WordToken[] = [
  { id: "dd", text: "đ", kind: "letter" },
  { id: "a", text: "a", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
  { id: "x", text: "x", kind: "letter" },
  { id: "e", text: "e", kind: "letter" },
];

export const floor2Lessons: LessonContent[] = createVocabularyFloorLessons({
  lessonPrefix: "w1p3-t3-f2",
  word: "đá",
  wordAssetKey: "ddas",
  wordTokens,
  wordTokenPool,
  reviewLetters: ["đ", "x", "a"],
});
