import { LessonContent } from "../map-structure";
import { createDiacriticBuildChallengeLessons } from "../lesson-templates";

export const floor4Lessons: LessonContent[] = createDiacriticBuildChallengeLessons({
  lessonPrefix: "t2-f4",
  targetLetter: "ă",
  baseLetter: "a",
  markerSymbol: "˘",
  debrisSymbols: ["★", "✦", "⬢", "●"],
  headerTitle: "Dấu kỳ diệu",
  title: "Chọn mức độ",
  instruction: "Bé chạm đúng dấu ˘ để ghép thành chữ ă.",
  countdownHintText: "ă",
});
