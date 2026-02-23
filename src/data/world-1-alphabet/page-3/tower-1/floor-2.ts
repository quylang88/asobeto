import type { LessonContent } from "../../types";
import { createLetterFloorLessons } from "../../page-helpers";

export const floor2Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "w1p3-t1-f2",
  letter: "v",
  letterAssetKey: "v",
  distractors: ["i", "h"],
});
