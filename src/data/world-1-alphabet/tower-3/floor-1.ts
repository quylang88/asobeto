import { LessonContent } from "../map-structure";
import { createLetterFloorLessons } from "../lesson-templates";

export const floor1Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "t3-f1",
  letter: "b",
  letterAssetKey: "b",
  distractors: ["d", "p"],
});
