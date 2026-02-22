import type { LessonContent } from "../../types";
import { createPage2LetterFloorLessons } from "../../page-helpers";

export const floor1Lessons: LessonContent[] = createPage2LetterFloorLessons({
  lessonPrefix: "w1p2-t4-f1",
  letter: "ư",
  letterAssetKey: "uw",
  distractors: ["t", "ơ"],
});
