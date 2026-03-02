import type { LessonContent } from "../../types";
import { createPage1DiacriticBuildFloorLessons } from "../../page-helpers";

export const floor4Lessons: LessonContent[] =
  createPage1DiacriticBuildFloorLessons({
    lessonId: "t2-f4-diacritic-build",
    targetLetter: "ă",
    baseLetter: "a",
    markerSymbol: "˘",
    debrisSymbols: ["★", "✦", "⬢", "●"],
    headerTitle: "Dấu kỳ diệu",
    title: "Chọn mức độ",
    instruction: "Bé chạm đúng dấu ˘ để ghép thành chữ ă.",
    countdownHintText: "ă",
  });
