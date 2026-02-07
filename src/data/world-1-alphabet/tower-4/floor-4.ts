import { LessonContent } from "../map-structure";
import { createVocabFloorLessons } from "../lesson-templates";

export const floor4Lessons: LessonContent[] = createVocabFloorLessons({
  lessonPrefix: "t4-f4",
  word: "bò",
  wordAssetKey: "bo",
  wordTokens: [
    { id: "b", text: "b", kind: "letter" },
    { id: "o", text: "o", kind: "letter" },
    { id: "tone-huyen", text: "dấu huyền", kind: "tone" },
  ],
  wordTokenPool: [
    { id: "b", text: "b", kind: "letter" },
    { id: "o", text: "o", kind: "letter" },
    { id: "tone-huyen", text: "dấu huyền", kind: "tone" },
    { id: "m", text: "m", kind: "letter" },
    { id: "e", text: "e", kind: "letter" },
  ],
  reviewLetters: ["O", "B", "E", "M"],
  reviewMode: true,
});
