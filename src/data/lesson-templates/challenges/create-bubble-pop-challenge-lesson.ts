import type { LessonContent } from "../../world-1-alphabet/map-structure";
import type { BubblePopGameDataInput } from "../../mini-games/bubble-pop";
import { withDefaultLessonFeedbackAudio } from "../../scoring-config";
import {
  BUBBLE_GAME_INSTRUCTION,
  BUBBLE_GAME_TITLE,
  createBubblePopGameConfig,
} from "../../mini-games/bubble-pop";

export interface BubblePopChallengeLessonConfig extends BubblePopGameDataInput {
  lessonId: string;
}

export function createBubblePopChallengeLesson(
  config: BubblePopChallengeLessonConfig,
): LessonContent {
  const { lessonId, ...gameConfigInput } = config;

  return {
    id: lessonId,
    type: "active",
    lessonKind: "bubble_pop_challenge",
    title: BUBBLE_GAME_TITLE,
    instruction: BUBBLE_GAME_INSTRUCTION,
    scoring: withDefaultLessonFeedbackAudio({
      metric: "none",
      passPolicy: "always",
      maxStars: 6,
    }),
    bubblePopGame: createBubblePopGameConfig(gameConfigInput),
  };
}
