import type { LessonContent, WordToken } from "../../types";
import { createPage2VocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "d", text: "d", kind: "letter" },
  { id: "ee", text: "ê", kind: "letter" },
];

const wordTokenPool: WordToken[] = [
  { id: "d", text: "d", kind: "letter" },
  { id: "ee", text: "ê", kind: "letter" },
  { id: "g", text: "g", kind: "letter" },
  { id: "aa", text: "â", kind: "letter" },
  { id: "u", text: "u", kind: "letter" },
];

export const floor3Lessons: LessonContent[] = createPage2VocabularyFloorLessons(
  {
    lessonPrefix: "w1p2-t5-f3",
    word: "dê",
    wordAssetKey: "dee",
    wordTokens,
    wordTokenPool,
    reviewLetters: ["ê", "d"],
  },
);
