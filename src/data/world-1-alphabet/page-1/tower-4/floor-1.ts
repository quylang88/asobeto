import type { LessonContent } from "../../types";
import { createPage1LetterFloorLessons } from "../../page-helpers";

export const floor1Lessons: LessonContent[] = createPage1LetterFloorLessons({
  lessonPrefix: "t4-f1",
  letter: "o",
  letterAssetKey: "o",
  distractors: ["ô", "a"],
});
