import type { LessonContent } from "../../types";
import { createPage2LetterFloorLessons } from "../../page-helpers";

export const floor1Lessons: LessonContent[] = createPage2LetterFloorLessons({
  lessonPrefix: "w1p2-t5-f1",
  letter: "ê",
  letterAssetKey: "ee",
  distractors: ["d", "â"],
});
