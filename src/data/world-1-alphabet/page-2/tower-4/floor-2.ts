import type { LessonContent } from "../../types";
import { createPage2LetterFloorLessons } from "../../page-helpers";

export const floor2Lessons: LessonContent[] = createPage2LetterFloorLessons({
  lessonPrefix: "w1p2-t4-f2",
  letter: "t",
  letterAssetKey: "t",
  distractors: ["ư", "s"],
});
