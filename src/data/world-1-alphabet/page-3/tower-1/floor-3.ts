import type { LessonContent, WordToken } from "../../types";
import { createVocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "v", text: "v", kind: "letter" },
  { id: "i", text: "i", kind: "letter" },
  { id: "tone-nang", text: "dấu nặng", kind: "tone" },
  { id: "t", text: "t", kind: "letter" },
];

const wordTokenPool: WordToken[] = [
  { id: "v", text: "v", kind: "letter" },
  { id: "i", text: "i", kind: "letter" },
  { id: "tone-nang", text: "dấu nặng", kind: "tone" },
  { id: "t", text: "t", kind: "letter" },
  { id: "h", text: "h", kind: "letter" },
  { id: "k", text: "k", kind: "letter" },
];

export const floor3Lessons: LessonContent[] = createVocabularyFloorLessons({
  lessonPrefix: "w1p3-t1-f3",
  word: "vịt",
  wordAssetKey: "vijt",
  wordTokens,
  wordTokenPool,
  reviewLetters: ["i", "v", "t"],
});
