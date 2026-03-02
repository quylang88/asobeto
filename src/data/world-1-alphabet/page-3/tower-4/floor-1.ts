import type { LessonContent } from "../../types";
import { createLetterFloorLessons } from "../../page-helpers";

export const floor1Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "w1p3-t4-f1",
  letter: "r",
  letterAssetKey: "r",
  distractors: ["p", "k"],
});
