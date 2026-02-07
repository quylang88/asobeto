import { LessonContent } from "../map-structure";
import { createVocabFloorLessons } from "../lesson-templates";

export const floor4Lessons: LessonContent[] = createVocabFloorLessons({
  lessonPrefix: "t2-f4",
  word: "ăn",
  wordAssetKey: "an-short-a",
  wordTokens: [
    { id: "aw", text: "ă", kind: "letter" },
    { id: "n", text: "n", kind: "letter" },
  ],
  wordTokenPool: [
    { id: "aw", text: "ă", kind: "letter" },
    { id: "n", text: "n", kind: "letter" },
    { id: "a", text: "a", kind: "letter" },
    { id: "c", text: "c", kind: "letter" },
    { id: "m", text: "m", kind: "letter" },
  ],
  reviewLetters: ["Ă", "N", "A", "C"],
  reviewMode: true,
});
