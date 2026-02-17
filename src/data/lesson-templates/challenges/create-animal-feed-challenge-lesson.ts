import type { LessonContent } from "../../world-1-alphabet/map-structure";
import type { AnimalFeedGameDataInput } from "../../mini-games/animal-feed";
import { withDefaultLessonFeedbackAudio } from "../../scoring-config";
import {
  ANIMAL_FEED_GAME_INSTRUCTION,
  ANIMAL_FEED_GAME_TITLE,
  createAnimalFeedGameConfig,
} from "../../mini-games/animal-feed";

export interface AnimalFeedChallengeLessonConfig extends AnimalFeedGameDataInput {
  lessonId: string;
}

export function createAnimalFeedChallengeLesson(
  config: AnimalFeedChallengeLessonConfig,
): LessonContent {
  const { lessonId, ...gameConfigInput } = config;

  return {
    id: lessonId,
    type: "active",
    lessonKind: "animal_feed_challenge",
    title: ANIMAL_FEED_GAME_TITLE,
    instruction: ANIMAL_FEED_GAME_INSTRUCTION,
    scoring: withDefaultLessonFeedbackAudio({
      metric: "none",
      passPolicy: "always",
      maxStars: 6,
    }),
    animalFeedGame: createAnimalFeedGameConfig(gameConfigInput),
  };
}
