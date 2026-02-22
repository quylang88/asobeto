import type { LessonContent } from "../../types";
import { createPage1LetterFloorLessons } from "../../page-helpers";

export const floor1Lessons: LessonContent[] = createPage1LetterFloorLessons({
  lessonPrefix: "t2-f1",
  letter: "ă",
  letterAssetKey: "aw",
  distractors: ["a", "â"],
});
