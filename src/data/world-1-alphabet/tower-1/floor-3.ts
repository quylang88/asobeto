import { LessonContent } from "../map-structure";
import { createVocabFloorLessons } from "../lesson-templates";

const baseFloor3Lessons = createVocabFloorLessons({
  lessonPrefix: "t1-f3",
  word: "cá",
  wordAssetKey: "fish",
  wordTokens: [
    { id: "c", text: "c", kind: "letter" },
    { id: "a", text: "a", kind: "letter" },
    { id: "tone-sac", text: "dấu sắc", kind: "tone" },
  ],
  wordTokenPool: [
    { id: "c", text: "c", kind: "letter" },
    { id: "a", text: "a", kind: "letter" },
    { id: "tone-sac", text: "dấu sắc", kind: "tone" },
    { id: "n", text: "n", kind: "letter" },
    { id: "o", text: "o", kind: "letter" },
  ],
  reviewLetters: ["A", "C"],
});

export const floor3Lessons: LessonContent[] = baseFloor3Lessons.map((lesson) => {
  if (lesson.id !== "t1-f3-l4" || lesson.type !== "active") {
    return lesson;
  }

  return {
    ...lesson,
    scoring: {
      ...(lesson.scoring ?? {
        metric: "trace_accuracy",
        passPolicy: "always" as const,
      }),
      starThresholds: {
        oneStar: 0.5,
        twoStars: 0.75,
      },
      maxStars: 2,
    },
  };
});
