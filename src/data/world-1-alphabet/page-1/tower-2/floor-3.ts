import type { LessonContent, WordToken } from "../../types";
import { createPage1VocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "aw", text: "ă", kind: "letter" },
  { id: "n", text: "n", kind: "letter" },
];

const wordTokenPool: WordToken[] = [
  { id: "aw", text: "ă", kind: "letter" },
  { id: "n", text: "n", kind: "letter" },
  { id: "a", text: "a", kind: "letter" },
  { id: "c", text: "c", kind: "letter" },
  { id: "m", text: "m", kind: "letter" },
];

export const floor3Lessons: LessonContent[] = createPage1VocabularyFloorLessons(
  {
    lessonPrefix: "t2-f3",
    word: "ăn",
    wordAssetKey: "awn",
    wordTokens,
    wordTokenPool,
    reviewLetters: ["ă", "n", "a", "c"],
  },
);
