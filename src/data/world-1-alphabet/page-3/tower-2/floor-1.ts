import type { LessonContent } from "../../types";
import { createLetterFloorLessons } from "../../page-helpers";

export const floor1Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "w1p3-t2-f1",
  letter: "h",
  letterAssetKey: "h",
  distractors: ["l", "k"],
});
