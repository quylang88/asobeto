import type { LessonContent, WordToken } from "../../types";
import { createPage1VocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "c", text: "c", kind: "letter" },
  { id: "a", text: "a", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
];

const wordTokenPool: WordToken[] = [
  { id: "c", text: "c", kind: "letter" },
  { id: "a", text: "a", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
  { id: "n", text: "n", kind: "letter" },
  { id: "o", text: "o", kind: "letter" },
];

export const floor3Lessons: LessonContent[] = createPage1VocabularyFloorLessons(
  {
    lessonPrefix: "t1-f3",
    word: "cá",
    wordAssetKey: "cas",
    wordTokens,
    wordTokenPool,
    reviewLetters: ["A", "C"],
  },
);
