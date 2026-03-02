import type { LessonContent } from "../../world-1-alphabet";
import { withDefaultLessonFeedbackAudio } from "../../scoring-config";
import {
  buildLetterIntroVoiceOptions,
  normalizeLetter,
  type LetterLessonBaseConfig,
} from "./shared";

export function createLetterTraceDemoLesson(
  config: LetterLessonBaseConfig,
): LessonContent {
  const { lessonId, letter } = config;
  const normalizedLetter = normalizeLetter(letter);

  return {
    id: lessonId,
    type: "passive",
    lessonKind: "letter_trace_demo",
    title: `Xem cách viết chữ cái "${normalizedLetter}"`,
    introVoiceOptions: buildLetterIntroVoiceOptions(3),
    targetLetter: normalizedLetter,
    targetText: normalizedLetter,
    gating: {
      requireAnimationComplete: true,
    },
    scoring: withDefaultLessonFeedbackAudio({
      metric: "none",
      passPolicy: "always",
      maxStars: 0,
    }),
  };
}
