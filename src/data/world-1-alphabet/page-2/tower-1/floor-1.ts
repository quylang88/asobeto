import type { LessonContent } from "../../types";
import { createPage2LetterFloorLessons } from "../../page-helpers";

export const floor1Lessons: LessonContent[] = createPage2LetterFloorLessons({
  lessonPrefix: "w1p2-t1-f1",
  letter: "u",
  letterAssetKey: "u",
  distractors: ["q", "ơ"],
});
