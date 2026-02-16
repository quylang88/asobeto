import type { LessonContent } from "../../world-1-alphabet/map-structure";
import {
  buildLetterIntroVoiceOptions,
  normalizeLetter,
  type LetterLessonBaseConfig,
} from "./shared";

export function createLetterTracePracticeLesson(
  config: LetterLessonBaseConfig,
): LessonContent {
  const { lessonId, letter } = config;
  const normalizedLetter = normalizeLetter(letter);

  return {
    id: lessonId,
    type: "active",
    lessonKind: "letter_trace_practice",
    title: `Viết lại chữ cái "${normalizedLetter}"`,
    introVoiceOptions: buildLetterIntroVoiceOptions(4),
    targetLetter: normalizedLetter,
    targetText: normalizedLetter,
    scoring: {
      metric: "trace_accuracy",
      passPolicy: "always",
      starThresholds: {
        oneStar: 0.5,
        twoStars: 0.75,
      },
      maxStars: 2,
    },
  };
}
