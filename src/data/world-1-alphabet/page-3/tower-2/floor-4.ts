import type { LessonContent, WordToken } from "../../types";
import { createVocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "l", text: "l", kind: "letter" },
  { id: "ow", text: "ơ", kind: "letter" },
  { id: "tone-nang", text: "dấu nặng", kind: "tone" },
  { id: "n", text: "n", kind: "letter" },
];

const wordTokenPool: WordToken[] = [
  { id: "l", text: "l", kind: "letter" },
  { id: "ow", text: "ơ", kind: "letter" },
  { id: "tone-nang", text: "dấu nặng", kind: "tone" },
  { id: "n", text: "n", kind: "letter" },
  { id: "h", text: "h", kind: "letter" },
  { id: "x", text: "x", kind: "letter" },
];

export const floor4Lessons: LessonContent[] = createVocabularyFloorLessons({
  lessonPrefix: "w1p3-t2-f4",
  word: "lợn",
  wordAssetKey: "lowjn",
  wordTokens,
  wordTokenPool,
  reviewLetters: ["h", "l", "ơ"],
});
