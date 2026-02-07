import { LessonContent } from "../map-structure";
import { createLetterFloorLessons } from "../lesson-templates";

export const floor2Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "t4-f2",
  letter: "B",
  letterAssetKey: "b",
  distractors: ["D", "P"],
});
