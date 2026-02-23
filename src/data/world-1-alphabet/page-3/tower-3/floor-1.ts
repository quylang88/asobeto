import type { LessonContent } from "../../types";
import { createLetterFloorLessons } from "../../page-helpers";

export const floor1Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "w1p3-t3-f1",
  letter: "đ",
  letterAssetKey: "dd",
  distractors: ["x", "r"],
});
