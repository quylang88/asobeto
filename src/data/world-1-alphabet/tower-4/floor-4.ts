import type { LessonContent } from "../types";
import { createAnimalFeedChallengeLesson } from "../../lesson-templates/challenges";

export const floor4Lessons: LessonContent[] = [
  createAnimalFeedChallengeLesson({
    lessonId: "t4-f4-animal-feed",
    headerTitle: "Bò ăn cỏ",
    title: "Chọn mức độ",
    instruction: "Chạm đúng bụi cỏ để cho bò ăn.",
    animalIconId: "bof",
    foodVisualId: "grass-bush",
    progressSentence: "bò ăn cỏ",
  }),
];
