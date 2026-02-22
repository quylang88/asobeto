import type { LessonContent } from "../../types";
import { createPage1LetterFloorLessons } from "../../page-helpers";

export const floor2Lessons: LessonContent[] = createPage1LetterFloorLessons({
  lessonPrefix: "t5-f2",
  letter: "e",
  letterAssetKey: "e",
  distractors: ["a", "o"],
});
