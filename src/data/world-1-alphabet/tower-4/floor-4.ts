import { LessonContent } from "../map-structure";
import { createAnimalFeedChallengeLessons } from "../lesson-templates";

export const floor4Lessons: LessonContent[] = createAnimalFeedChallengeLessons({
  lessonPrefix: "t4-f4",
  headerTitle: "Bò ăn cỏ",
  title: "Chọn mức độ",
  instruction: "Chạm đúng bụi cỏ để cho bò ăn.",
  animalIconId: "bof",
  foodVisualId: "grass-bush",
  progressSentence: "bò ăn cỏ",
});
