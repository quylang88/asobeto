import type { LessonContent } from "../../types";
import { createLetterFloorLessons } from "../../page-helpers";

export const floor1Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "w1p3-t5-f1",
  letter: "k",
  letterAssetKey: "k",
  distractors: ["y", "x"],
});
