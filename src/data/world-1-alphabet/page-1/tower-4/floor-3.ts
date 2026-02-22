import type { LessonContent, WordToken } from "../../types";
import { createPage1VocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "b", text: "b", kind: "letter" },
  { id: "o", text: "o", kind: "letter" },
  { id: "tone-huyen", text: "dấu huyền", kind: "tone" },
];

const wordTokenPool: WordToken[] = [
  { id: "b", text: "b", kind: "letter" },
  { id: "o", text: "o", kind: "letter" },
  { id: "tone-huyen", text: "dấu huyền", kind: "tone" },
  { id: "m", text: "m", kind: "letter" },
  { id: "e", text: "e", kind: "letter" },
];

export const floor3Lessons: LessonContent[] = createPage1VocabularyFloorLessons(
  {
    lessonPrefix: "t4-f3",
    word: "bò",
    wordAssetKey: "bof",
    wordTokens,
    wordTokenPool,
    reviewLetters: ["O", "B", "E", "M"],
  },
);
