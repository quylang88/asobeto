import type { LessonContent } from "../../types";
import { createPage1LetterFloorLessons } from "../../page-helpers";

export const floor2Lessons: LessonContent[] = createPage1LetterFloorLessons({
  lessonPrefix: "t2-f2",
  letter: "n",
  letterAssetKey: "n",
  distractors: ["m", "h"],
});
