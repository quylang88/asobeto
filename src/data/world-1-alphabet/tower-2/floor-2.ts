import { LessonContent } from "../map-structure";
import { createLetterFloorLessons } from "../lesson-templates";

export const floor2Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "t2-f2",
  letter: "N",
  letterAssetKey: "n",
  distractors: ["M", "H"],
});
