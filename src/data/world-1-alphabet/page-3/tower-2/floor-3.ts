import type { LessonContent } from "../../types";
import { createLetterFloorLessons } from "../../page-helpers";

export const floor3Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "w1p3-t2-f3",
  letter: "l",
  letterAssetKey: "l",
  distractors: ["h", "r"],
});
