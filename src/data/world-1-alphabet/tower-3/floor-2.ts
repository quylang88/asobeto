import { LessonContent } from "../map-structure";
import { createLetterFloorLessons } from "../lesson-templates";

export const floor2Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "t3-f2",
  letter: "M",
  letterAssetKey: "m",
  distractors: ["N", "B"],
});
