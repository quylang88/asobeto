import type { LessonContent } from "../../types";
import { createPage1LetterFloorLessons } from "../../page-helpers";

export const floor2Lessons: LessonContent[] = createPage1LetterFloorLessons({
  lessonPrefix: "t3-f2",
  letter: "ô",
  letterAssetKey: "oo",
  distractors: ["o", "ơ"],
});
