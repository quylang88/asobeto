import type { LessonContent, WordToken } from "../../types";
import { createVocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "r", text: "r", kind: "letter" },
  { id: "u", text: "u", kind: "letter" },
  { id: "tone-huyen", text: "dấu huyền", kind: "tone" },
  { id: "a", text: "a", kind: "letter" },
];

const wordTokenPool: WordToken[] = [
  { id: "r", text: "r", kind: "letter" },
  { id: "u", text: "u", kind: "letter" },
  { id: "tone-huyen", text: "dấu huyền", kind: "tone" },
  { id: "a", text: "a", kind: "letter" },
  { id: "p", text: "p", kind: "letter" },
  { id: "k", text: "k", kind: "letter" },
];

export const floor3Lessons: LessonContent[] = createVocabularyFloorLessons({
  lessonPrefix: "w1p3-t4-f3",
  word: "rùa",
  wordAssetKey: "ruaf",
  wordTokens,
  wordTokenPool,
  reviewLetters: ["r", "p", "u"],
});
