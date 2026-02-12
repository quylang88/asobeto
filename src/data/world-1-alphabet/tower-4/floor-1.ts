import { LessonContent } from "../map-structure";
import { createLetterFloorLessons } from "../lesson-templates";

export const floor1Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "t4-f1",
  letter: "o",
  letterAssetKey: "o",
  distractors: ["ô", "a"],
});
