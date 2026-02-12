import { LessonContent } from "../map-structure";
import { createVocabFloorLessons } from "../lesson-templates";

export const floor3Lessons: LessonContent[] = createVocabFloorLessons({
  lessonPrefix: "t5-f3",
  word: "mẹ",
  wordAssetKey: "mej",
  wordTokens: [
    { id: "m", text: "m", kind: "letter" },
    { id: "e", text: "e", kind: "letter" },
    { id: "tone-nang", text: "dấu nặng", kind: "tone" },
  ],
  wordTokenPool: [
    { id: "m", text: "m", kind: "letter" },
    { id: "e", text: "e", kind: "letter" },
    { id: "tone-nang", text: "dấu nặng", kind: "tone" },
    { id: "o", text: "o", kind: "letter" },
    { id: "b", text: "b", kind: "letter" },
    { id: "tone-sac", text: "dấu sắc", kind: "tone" },
  ],
  reviewLetters: ["m", "e", "o"],
});
