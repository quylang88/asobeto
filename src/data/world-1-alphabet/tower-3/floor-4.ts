import { LessonContent } from "../map-structure";
import { createVocabFloorLessons } from "../lesson-templates";

export const floor4Lessons: LessonContent[] = createVocabFloorLessons({
  lessonPrefix: "t3-f4",
  word: "mẹ",
  wordAssetKey: "me",
  wordTokens: [
    { id: "m", text: "m", kind: "letter" },
    { id: "e", text: "e", kind: "letter" },
    { id: "tone-nang", text: "dấu nặng", kind: "tone" },
  ],
  wordTokenPool: [
    { id: "m", text: "m", kind: "letter" },
    { id: "e", text: "e", kind: "letter" },
    { id: "tone-nang", text: "dấu nặng", kind: "tone" },
    { id: "n", text: "n", kind: "letter" },
    { id: "aw", text: "ă", kind: "letter" },
  ],
  reviewLetters: ["E", "M", "Ă", "N"],
  reviewMode: true,
});
