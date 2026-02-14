import { LessonContent } from "../map-structure";
import { createDiacriticBuildChallengeLesson } from "../../lesson-templates/challenges";

export const floor4Lessons: LessonContent[] = [
  createDiacriticBuildChallengeLesson({
    lessonId: "t3-f4-diacritic-build",
    targetLetter: "bố",
    baseLetter: "bô",
    markerSymbol: "◌́",
    debrisSymbols: ["◌̀", "◌̉", "◌̃", "◌̣"],
    interactionMode: "catcher_drag",
    catcherHitboxScale: 1,
    headerTitle: "Hứng dấu",
    title: "Chọn mức độ",
    instruction: "Bé kéo “bô” để hứng dấu sắc và tạo chữ bố.",
    rules: [
      "Kéo bô qua trái phải để hứng đúng dấu sắc ´.",
      "Dấu sai chạm bô sẽ trừ tim; né dấu sai để an toàn.",
      "Nếu dấu sắc rơi lọt thì bị trừ 1 tiến độ.",
    ],
    countdownHintText: "bố",
    minSpawnVerticalGap: 120,
    tutorialDurationMs: 7000,
    levelOverrides: {
      easy: { startLives: 3 },
      normal: { startLives: 3 },
      hard: { startLives: 3 },
    },
  }),
];
