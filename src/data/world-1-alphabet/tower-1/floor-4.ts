import { LessonContent } from "../map-structure";

export const floor4Lessons: LessonContent[] = [
  {
    id: "t1-f4-bubble-pop",
    type: "active",
    lessonKind: "bubble_pop_challenge",
    title: "Thử thách bóng bay chữ",
    instruction: "Chạm đúng bóng bay chữ theo yêu cầu để săn sao.",
    scoring: {
      metric: "none",
      passPolicy: "always",
      maxStars: 6,
    },
    bubblePopGame: {
      title: "Chọn mức độ",
      headerTitle: "Bóng bay chữ cái",
      instruction: "Bé hãy chạm vào bóng bay chữ cái theo yêu cầu.",
      rules: ["Chạm đúng bóng bay chữ theo yêu cầu."],
      rulesAudioText: "Bé hãy chạm vào bóng bay chữ cái theo yêu cầu.",
      startLives: 3,
      targetLetters: ["a", "c"],
      laneCount: 5,
      minSpawnVerticalGap: 94,
      levels: [
        {
          id: "easy",
          label: "Dễ",
          starsReward: 1,
          durationSeconds: 35,
          targetScore: 10,
          minLivesToPass: 3,
          targetBubbleRatio: 0.8,
          emptyBubbleRatio: 0.1,
          bubbleSize: 112,
          spawnIntervalMs: {
            min: 860,
            max: 1040,
          },
          speedRange: {
            min: 62,
            max: 88,
          },
        },
        {
          id: "normal",
          label: "Vừa",
          starsReward: 2,
          durationSeconds: 35,
          targetScore: 15,
          minLivesToPass: 2,
          targetBubbleRatio: 0.6,
          emptyBubbleRatio: 0.12,
          bubbleSize: 96,
          spawnIntervalMs: {
            min: 720,
            max: 900,
          },
          speedRange: {
            min: 90,
            max: 126,
          },
        },
        {
          id: "hard",
          label: "Khó",
          starsReward: 3,
          durationSeconds: 30,
          targetScore: 20,
          minLivesToPass: 2,
          targetBubbleRatio: 0.5,
          emptyBubbleRatio: 0.1,
          bubbleSize: 82,
          spawnIntervalMs: {
            min: 600,
            max: 760,
          },
          speedRange: {
            min: 126,
            max: 182,
          },
          allowPairSpawn: true,
          pairSpawnChance: 0.25,
        },
      ],
    },
  },
];
