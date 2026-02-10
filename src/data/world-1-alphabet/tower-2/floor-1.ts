import { LessonContent } from "../map-structure";
import { createLetterFloorLessons } from "../lesson-templates";

export const floor1Lessons: LessonContent[] = createLetterFloorLessons({
  lessonPrefix: "t2-f1",
  letter: "ă",
  letterAssetKey: "aw",
  distractors: ["a", "â"],
});
