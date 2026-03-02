import type { LessonContent } from "../../types";
import { createLetterFloorLessons } from "../../page-helpers";

export const floor2Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "w1p3-t4-f2",
  letter: "p",
  letterAssetKey: "p",
  distractors: ["r", "y"],
});
