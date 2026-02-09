import { LessonContent } from "../map-structure";
import { createVocabFloorLessons } from "../lesson-templates";

export const floor3Lessons: LessonContent[] = createVocabFloorLessons({
  lessonPrefix: "t1-f3",
  word: "cá",
  wordAssetKey: "fish",
  wordTokens: [
    { id: "c", text: "c", kind: "letter" },
    { id: "a", text: "a", kind: "letter" },
    { id: "tone-sac", text: "dấu sắc", kind: "tone" },
  ],
  wordTokenPool: [
    { id: "c", text: "c", kind: "letter" },
    { id: "a", text: "a", kind: "letter" },
    { id: "tone-sac", text: "dấu sắc", kind: "tone" },
    { id: "n", text: "n", kind: "letter" },
    { id: "o", text: "o", kind: "letter" },
  ],
  reviewLetters: ["A", "C"],
});
