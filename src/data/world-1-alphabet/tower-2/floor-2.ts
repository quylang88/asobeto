import { LessonContent } from "../map-structure";
import { createLetterFloorLessons } from "../lesson-templates";

export const floor2Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "t2-f2",
  letter: "n",
  letterAssetKey: "n",
  distractors: ["m", "h"],
});
