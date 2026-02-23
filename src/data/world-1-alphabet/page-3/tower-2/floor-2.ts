import type { LessonContent, WordToken } from "../../types";
import { createVocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "h", text: "h", kind: "letter" },
  { id: "o", text: "o", kind: "letter" },
  { id: "tone-hoi", text: "dấu hỏi", kind: "tone" },
];

const wordTokenPool: WordToken[] = [
  { id: "h", text: "h", kind: "letter" },
  { id: "o", text: "o", kind: "letter" },
  { id: "tone-hoi", text: "dấu hỏi", kind: "tone" },
  { id: "l", text: "l", kind: "letter" },
  { id: "x", text: "x", kind: "letter" },
];

export const floor2Lessons: LessonContent[] = createVocabularyFloorLessons({
  lessonPrefix: "w1p3-t2-f2",
  word: "hổ",
  wordAssetKey: "hor",
  wordTokens,
  wordTokenPool,
  reviewLetters: ["h", "l", "o"],
});
