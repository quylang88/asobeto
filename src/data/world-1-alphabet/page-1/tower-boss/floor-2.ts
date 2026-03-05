import type { LessonContent } from "../../types";
import { createMemoryFlipChallengeLesson } from "../../../lesson-templates/challenges";

export const floor2Lessons: LessonContent[] = [
  createMemoryFlipChallengeLesson({
    lessonId: "boss-f2-memory-flip",
    title: "Vòng quay bí ẩn",
    headerTitle: "Boss",
    instruction: "Vượt qua vòng quay bí ẩn của BOSS.",
    rules: [
      "Lật 2 thẻ mỗi lượt để tìm cặp giống nhau.",
      "Ghép đúng thì thẻ biến mất.",
      "Ghép sai thì thẻ úp lại sau một chút.",
    ],
  }),
];
