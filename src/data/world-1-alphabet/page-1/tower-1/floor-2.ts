import type { LessonContent } from "../../types";
import { createPage1LetterFloorLessons } from "../../page-helpers";

export const floor2Lessons: LessonContent[] = createPage1LetterFloorLessons({
  lessonPrefix: "t1-f2",
  letter: "c",
  letterAssetKey: "c",
  distractors: ["a", "b"],
});
