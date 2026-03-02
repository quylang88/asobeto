import type { LessonContent } from "../../types";
import { createPage1LetterFloorLessons } from "../../page-helpers";

export const floor1Lessons: LessonContent[] = createPage1LetterFloorLessons({
  lessonPrefix: "t5-f1",
  letter: "m",
  letterAssetKey: "m",
  distractors: ["n", "e"],
});
