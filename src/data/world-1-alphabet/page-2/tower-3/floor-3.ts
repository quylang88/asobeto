import type { LessonContent, WordToken } from "../../types";
import { createPage2VocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "g", text: "g", kind: "letter" },
  { id: "aa", text: "â", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
];

const wordTokenPool: WordToken[] = [
  { id: "g", text: "g", kind: "letter" },
  { id: "aa", text: "â", kind: "letter" },
  { id: "tone-sac", text: "dấu sắc", kind: "tone" },
  { id: "ow", text: "ơ", kind: "letter" },
  { id: "t", text: "t", kind: "letter" },
];

export const floor3Lessons: LessonContent[] = createPage2VocabularyFloorLessons(
  {
    lessonPrefix: "w1p2-t3-f3",
    word: "gấu",
    wordAssetKey: "gaaus",
    wordTokens,
    wordTokenPool,
    reviewLetters: ["â", "g", "u"],
  },
);
