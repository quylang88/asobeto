import { LessonContent } from "../map-structure";
import { createLetterFloorLessons } from "../lesson-templates";

export const floor2Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "t5-f2",
  letter: "e",
  letterAssetKey: "e",
  distractors: ["a", "o"],
});
