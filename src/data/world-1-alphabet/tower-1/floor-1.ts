import { LessonContent } from "../map-structure";
import { createLetterFloorLessons } from "../lesson-templates";

export const floor1Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "t1-f1",
  letter: "a",
  letterAssetKey: "a",
  distractors: ["ă", "o"],
});
