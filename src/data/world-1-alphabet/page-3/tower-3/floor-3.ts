import type { LessonContent } from "../../types";
import { createLetterFloorLessons } from "../../page-helpers";

export const floor3Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "w1p3-t3-f3",
  letter: "x",
  letterAssetKey: "x",
  distractors: ["đ", "k"],
});
