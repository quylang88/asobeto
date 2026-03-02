import type { LessonContent, WordToken } from "../../types";
import { createPage2VocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "m", text: "m", kind: "letter" },
  { id: "u", text: "u", kind: "letter" },
  { id: "tone-nga", text: "dấu ngã", kind: "tone" },
];

const wordTokenPool: WordToken[] = [
  { id: "m", text: "m", kind: "letter" },
  { id: "u", text: "u", kind: "letter" },
  { id: "tone-nga", text: "dấu ngã", kind: "tone" },
  { id: "q", text: "q", kind: "letter" },
  { id: "s", text: "s", kind: "letter" },
  { id: "d", text: "d", kind: "letter" },
];

export const floor3Lessons: LessonContent[] = createPage2VocabularyFloorLessons(
  {
    lessonPrefix: "w1p2-t1-f3",
    word: "mũ",
    wordAssetKey: "mux",
    wordTokens,
    wordTokenPool,
    reviewLetters: ["u", "q", "m"],
  },
);
