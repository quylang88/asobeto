import type { LessonContent } from "../../world-1-alphabet";
import type { DiacriticBuildGameDataInput } from "../../mini-games/diacritic-build";
import { withDefaultLessonFeedbackAudio } from "../../scoring-config";
import {
  DIACRITIC_BUILD_GAME_INSTRUCTION,
  DIACRITIC_BUILD_GAME_TITLE,
  createDiacriticBuildGameConfig,
} from "../../mini-games/diacritic-build";

export interface DiacriticBuildChallengeLessonConfig
  extends DiacriticBuildGameDataInput {
  lessonId: string;
}

export function createDiacriticBuildChallengeLesson(
  config: DiacriticBuildChallengeLessonConfig,
): LessonContent {
  const { lessonId, ...gameConfigInput } = config;

  return {
    id: lessonId,
    type: "active",
    lessonKind: "diacritic_build_challenge",
    title: DIACRITIC_BUILD_GAME_TITLE,
    instruction: DIACRITIC_BUILD_GAME_INSTRUCTION,
    scoring: withDefaultLessonFeedbackAudio({
      metric: "none",
      passPolicy: "always",
      maxStars: 6,
    }),
    diacriticBuildGame: createDiacriticBuildGameConfig(gameConfigInput),
  };
}
