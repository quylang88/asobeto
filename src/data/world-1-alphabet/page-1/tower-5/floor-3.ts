import type { LessonContent, WordToken } from "../../types";
import { createPage1VocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "m", text: "m", kind: "letter" },
  { id: "e", text: "e", kind: "letter" },
  { id: "tone-nang", text: "dấu nặng", kind: "tone" },
];

const wordTokenPool: WordToken[] = [
  { id: "m", text: "m", kind: "letter" },
  { id: "e", text: "e", kind: "letter" },
  { id: "tone-nang", text: "dấu nặng", kind: "tone" },
  { id: "o", text: "o", kind: "letter" },
  { id: "b", text: "b", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
];

export const floor3Lessons: LessonContent[] = createPage1VocabularyFloorLessons(
  {
    lessonPrefix: "t5-f3",
    word: "mẹ",
    wordAssetKey: "mej",
    wordTokens,
    wordTokenPool,
    reviewLetters: ["m", "e", "o"],
  },
);
