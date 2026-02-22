import type { LessonContent } from "../../types";
import { createPage1LetterFloorLessons } from "../../page-helpers";

export const floor1Lessons: LessonContent[] = createPage1LetterFloorLessons({
  lessonPrefix: "t3-f1",
  letter: "b",
  letterAssetKey: "b",
  distractors: ["d", "p"],
});
