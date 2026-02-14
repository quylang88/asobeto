import { LessonContent } from "../map-structure";
import { createDiacriticBuildChallengeLesson } from "../../lesson-templates/challenges";

export const floor4Lessons: LessonContent[] = [
  createDiacriticBuildChallengeLesson({
    lessonId: "t2-f4-diacritic-build",
    targetLetter: "ă",
    baseLetter: "a",
    markerSymbol: "˘",
    debrisSymbols: ["★", "✦", "⬢", "●"],
    headerTitle: "Dấu kỳ diệu",
    title: "Chọn mức độ",
    instruction: "Bé chạm đúng dấu ˘ để ghép thành chữ ă.",
    countdownHintText: "ă",
  }),
];
