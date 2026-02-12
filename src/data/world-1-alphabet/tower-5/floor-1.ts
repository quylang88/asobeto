import { LessonContent } from "../map-structure";
import { createLetterFloorLessons } from "../lesson-templates";

export const floor1Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "t5-f1",
  letter: "ô",
  letterAssetKey: "oo",
  distractors: ["o", "ơ"],
});
