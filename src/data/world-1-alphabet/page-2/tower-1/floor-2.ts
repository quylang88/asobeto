import type { LessonContent } from "../../types";
import { createPage2LetterFloorLessons } from "../../page-helpers";

export const floor2Lessons: LessonContent[] = createPage2LetterFloorLessons({
  lessonPrefix: "w1p2-t1-f2",
  letter: "q",
  letterAssetKey: "q",
  distractors: ["u", "g"],
});
