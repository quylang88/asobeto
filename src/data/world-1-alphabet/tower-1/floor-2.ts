import { LessonContent } from "../map-structure";
import { createLetterFloorLessons } from "../lesson-templates";

export const floor2Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "t1-f2",
  letter: "c",
  letterAssetKey: "c",
  distractors: ["a", "b"],
});
