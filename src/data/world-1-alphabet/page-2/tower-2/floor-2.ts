import type { LessonContent } from "../../types";
import { createPage2LetterFloorLessons } from "../../page-helpers";

export const floor2Lessons: LessonContent[] = createPage2LetterFloorLessons({
  lessonPrefix: "w1p2-t2-f2",
  letter: "s",
  letterAssetKey: "s",
  distractors: ["ơ", "t"],
});
