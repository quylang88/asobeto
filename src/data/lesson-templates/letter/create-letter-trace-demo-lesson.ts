import type { LessonContent } from "../../world-1-alphabet/map-structure";
import {
  buildLetterIntroVoice,
  normalizeLetter,
  type LetterLessonBaseConfig,
} from "./shared";

export function createLetterTraceDemoLesson(
  config: LetterLessonBaseConfig,
): LessonContent {
  const { lessonId, letter, letterAssetKey } = config;
  const normalizedLetter = normalizeLetter(letter);

  return {
    id: lessonId,
    type: "passive",
    lessonKind: "letter_trace_demo",
    title: `Xem cách viết chữ cái "${normalizedLetter}"`,
    introVoice: buildLetterIntroVoice(letterAssetKey, 3),
    targetLetter: normalizedLetter,
    targetText: normalizedLetter,
    gating: {
      requireAnimationComplete: true,
    },
    scoring: {
      metric: "none",
      passPolicy: "always",
      maxStars: 0,
    },
  };
}
