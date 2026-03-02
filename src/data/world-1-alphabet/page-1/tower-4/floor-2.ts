import type { LessonContent, WordToken } from "../../types";
import { createPage1VocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "c", text: "c", kind: "letter" },
  { id: "o", text: "o", kind: "letter" },
  { id: "tone-hoi", text: "dấu hỏi", kind: "tone" },
];

const wordTokenPool: WordToken[] = [
  { id: "c", text: "c", kind: "letter" },
  { id: "o", text: "o", kind: "letter" },
  { id: "tone-hoi", text: "dấu hỏi", kind: "tone" },
  { id: "b", text: "b", kind: "letter" },
  { id: "tone-huyen", text: "dấu huyền", kind: "tone" },
];

export const floor2Lessons: LessonContent[] = createPage1VocabularyFloorLessons(
  {
    lessonPrefix: "t4-f2",
    word: "cỏ",
    wordAssetKey: "cor",
    wordTokens,
    wordTokenPool,
    reviewLetters: ["o", "c", "b"],
  },
);
