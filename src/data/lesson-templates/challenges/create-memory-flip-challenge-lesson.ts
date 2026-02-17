import type { LessonContent } from "../../world-1-alphabet/map-structure";
import type { MemoryFlipGameDataInput } from "../../mini-games/memory-flip";
import { withDefaultLessonFeedbackAudio } from "../../scoring-config";
import {
  MEMORY_FLIP_GAME_INSTRUCTION,
  MEMORY_FLIP_GAME_TITLE,
  createMemoryFlipGameConfig,
} from "../../mini-games/memory-flip";

export interface MemoryFlipChallengeLessonConfig extends MemoryFlipGameDataInput {
  lessonId: string;
}

export function createMemoryFlipChallengeLesson(
  config: MemoryFlipChallengeLessonConfig,
): LessonContent {
  const { lessonId, ...gameConfigInput } = config;

  return {
    id: lessonId,
    type: "active",
    lessonKind: "memory_flip_challenge",
    title: MEMORY_FLIP_GAME_TITLE,
    instruction: MEMORY_FLIP_GAME_INSTRUCTION,
    scoring: withDefaultLessonFeedbackAudio({
      metric: "none",
      passPolicy: "always",
      maxStars: 6,
    }),
    memoryFlipGame: createMemoryFlipGameConfig(gameConfigInput),
  };
}
