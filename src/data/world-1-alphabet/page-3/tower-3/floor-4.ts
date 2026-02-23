import type { LessonContent, WordToken } from "../../types";
import { createVocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "x", text: "x", kind: "letter" },
  { id: "e", text: "e", kind: "letter" },
];

const wordTokenPool: WordToken[] = [
  { id: "x", text: "x", kind: "letter" },
  { id: "e", text: "e", kind: "letter" },
  { id: "dd", text: "đ", kind: "letter" },
  { id: "a", text: "a", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
];

export const floor4Lessons: LessonContent[] = createVocabularyFloorLessons({
  lessonPrefix: "w1p3-t3-f4",
  word: "xe",
  wordAssetKey: "xe",
  wordTokens,
  wordTokenPool,
  reviewLetters: ["đ", "x", "e"],
});
