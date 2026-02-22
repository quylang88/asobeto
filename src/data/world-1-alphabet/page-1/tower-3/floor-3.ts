import type { LessonContent, WordToken } from "../../types";
import { createPage1VocabularyFloorLessons } from "../../page-helpers";

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

export const floor3Lessons: LessonContent[] = createPage1VocabularyFloorLessons(
  {
    lessonPrefix: "t3-f3",
    word: "bố",
    wordAssetKey: "boos",
    wordTokens,
    wordTokenPool,
    reviewLetters: ["ô", "b", "o"],
  },
);
