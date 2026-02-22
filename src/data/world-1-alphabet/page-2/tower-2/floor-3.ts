import type { LessonContent, WordToken } from "../../types";
import { createPage2VocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "n", text: "n", kind: "letter" },
  { id: "ow", text: "ơ", kind: "letter" },
];

const wordTokenPool: WordToken[] = [
  { id: "n", text: "n", kind: "letter" },
  { id: "ow", text: "ơ", kind: "letter" },
  { id: "s", text: "s", kind: "letter" },
  { id: "g", text: "g", kind: "letter" },
  { id: "ee", text: "ê", kind: "letter" },
];

export const floor3Lessons: LessonContent[] = createPage2VocabularyFloorLessons(
  {
    lessonPrefix: "w1p2-t2-f3",
    word: "nơ",
    wordAssetKey: "now",
    wordTokens,
    wordTokenPool,
    reviewLetters: ["ơ", "s", "n"],
  },
);
