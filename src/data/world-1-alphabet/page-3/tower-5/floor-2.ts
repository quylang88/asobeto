import type { LessonContent } from "../../types";
import { createLetterFloorLessons } from "../../page-helpers";

export const floor2Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "w1p3-t5-f2",
  letter: "y",
  letterAssetKey: "y",
  distractors: ["k", "r"],
});
