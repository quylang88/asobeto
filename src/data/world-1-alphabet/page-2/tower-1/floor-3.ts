import type { LessonContent, WordToken } from "../../types";
import { createPage2VocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "q", text: "q", kind: "letter" },
  { id: "u", text: "u", kind: "letter" },
  { id: "a", text: "a", kind: "letter" },
  { id: "tone-hoi", text: "dấu hỏi", kind: "tone" },
];

const wordTokenPool: WordToken[] = [
  { id: "q", text: "q", kind: "letter" },
  { id: "u", text: "u", kind: "letter" },
  { id: "a", text: "a", kind: "letter" },
  { id: "tone-hoi", text: "dấu hỏi", kind: "tone" },
  { id: "s", text: "s", kind: "letter" },
  { id: "d", text: "d", kind: "letter" },
];

export const floor3Lessons: LessonContent[] = createPage2VocabularyFloorLessons(
  {
    lessonPrefix: "w1p2-t1-f3",
    word: "quả",
    wordAssetKey: "quar",
    wordTokens,
    wordTokenPool,
    reviewLetters: ["u", "q", "a"],
  },
);
