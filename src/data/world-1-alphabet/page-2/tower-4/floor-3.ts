import type { LessonContent, WordToken } from "../../types";
import { createPage2VocabularyFloorLessons } from "../../page-helpers";

const wordTokens: WordToken[] = [
  { id: "s", text: "s", kind: "letter" },
  { id: "uw-1", text: "ư", kind: "letter" },
  { id: "t", text: "t", kind: "letter" },
  { id: "uw-2", text: "ư", kind: "letter" },
  { id: "tone-hoi", text: "dấu hỏi", kind: "tone" },
];

const wordTokenPool: WordToken[] = [
  { id: "s", text: "s", kind: "letter" },
  { id: "uw-1", text: "ư", kind: "letter" },
  { id: "t", text: "t", kind: "letter" },
  { id: "uw-2", text: "ư", kind: "letter" },
  { id: "tone-hoi", text: "dấu hỏi", kind: "tone" },
  { id: "d", text: "d", kind: "letter" },
  { id: "ee", text: "ê", kind: "letter" },
];

export const floor3Lessons: LessonContent[] = createPage2VocabularyFloorLessons(
  {
    lessonPrefix: "w1p2-t4-f3",
    word: "sư tử",
    wordAssetKey: "suwtuwr",
    wordTokens,
    wordTokenPool,
    reviewLetters: ["ư", "t", "s"],
  },
);
