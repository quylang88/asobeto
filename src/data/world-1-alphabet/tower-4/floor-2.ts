import { LessonContent } from "../map-structure";
import { createVocabFloorLessons } from "../lesson-templates";

export const floor2Lessons: LessonContent[] = createVocabFloorLessons({
  lessonPrefix: "t4-f2",
  word: "cỏ",
  wordAssetKey: "cor",
  wordTokens: [
    { id: "c", text: "c", kind: "letter" },
    { id: "o", text: "o", kind: "letter" },
    { id: "tone-hoi", text: "dấu hỏi", kind: "tone" },
  ],
  wordTokenPool: [
    { id: "c", text: "c", kind: "letter" },
    { id: "o", text: "o", kind: "letter" },
    { id: "tone-hoi", text: "dấu hỏi", kind: "tone" },
    { id: "b", text: "b", kind: "letter" },
    { id: "tone-huyen", text: "dấu huyền", kind: "tone" },
  ],
  reviewLetters: ["o", "c", "b"],
});
