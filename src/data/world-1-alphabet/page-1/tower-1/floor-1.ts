import type { LessonContent } from "../../types";
import { createPage1LetterFloorLessons } from "../../page-helpers";

export const floor1Lessons: LessonContent[] = createPage1LetterFloorLessons({
  lessonPrefix: "t1-f1",
  letter: "a",
  letterAssetKey: "a",
  distractors: ["ă", "o"],
});
