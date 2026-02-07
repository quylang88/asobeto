import { LessonContent } from "../map-structure";
import { createVocabFloorLessons } from "../lesson-templates";

export const floor4Lessons: LessonContent[] = createVocabFloorLessons({
  lessonPrefix: "t5-f4",
  word: "bố",
  wordAssetKey: "bo-father",
  wordTokens: [
    { id: "b", text: "b", kind: "letter" },
    { id: "oo", text: "ô", kind: "letter" },
    { id: "tone-sac", text: "dấu sắc", kind: "tone" },
  ],
  wordTokenPool: [
    { id: "b", text: "b", kind: "letter" },
    { id: "oo", text: "ô", kind: "letter" },
    { id: "tone-sac", text: "dấu sắc", kind: "tone" },
    { id: "o", text: "o", kind: "letter" },
    { id: "tone-huyen", text: "dấu huyền", kind: "tone" },
  ],
  reviewLetters: ["Ô", "B", "O"],
  reviewMode: true,
});
