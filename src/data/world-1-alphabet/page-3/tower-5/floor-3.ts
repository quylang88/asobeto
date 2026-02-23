import type { LessonContent, WordToken } from "../../types";
import { createVocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "k", text: "k", kind: "letter" },
  { id: "i", text: "i", kind: "letter" },
  { id: "ee", text: "ê", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
  { id: "n", text: "n", kind: "letter" },
];

const wordTokenPool: WordToken[] = [
  { id: "k", text: "k", kind: "letter" },
  { id: "i", text: "i", kind: "letter" },
  { id: "ee", text: "ê", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
  { id: "n", text: "n", kind: "letter" },
  { id: "y", text: "y", kind: "letter" },
  { id: "h", text: "h", kind: "letter" },
];

export const floor3Lessons: LessonContent[] = createVocabularyFloorLessons({
  lessonPrefix: "w1p3-t5-f3",
  word: "kiến",
  wordAssetKey: "kieens",
  wordTokens,
  wordTokenPool,
  reviewLetters: ["k", "y", "ê"],
});
