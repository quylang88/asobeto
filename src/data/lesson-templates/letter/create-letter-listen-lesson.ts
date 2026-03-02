import type { LessonContent } from "../../world-1-alphabet";
import { withDefaultLessonFeedbackAudio } from "../../scoring-config";
import {
  buildLetterIntroVoiceOptions,
  buildMainLetterAudio,
  normalizeLetter,
  type LetterLessonBaseConfig,
} from "./shared";

export function createLetterListenLesson(
  config: LetterLessonBaseConfig,
): LessonContent {
  const { lessonId, letter, letterAssetKey } = config;
  const normalizedLetter = normalizeLetter(letter);

  return {
    id: lessonId,
    type: "passive",
    lessonKind: "letter_listen",
    title: `Làm quen chữ cái "${normalizedLetter}"`,
    introVoiceOptions: buildLetterIntroVoiceOptions(1),
    mainAudio: buildMainLetterAudio(letterAssetKey),
    targetLetter: normalizedLetter,
    gating: {
      requiredAudioPlays: 3,
    },
    scoring: withDefaultLessonFeedbackAudio({
      metric: "none",
      passPolicy: "always",
      maxStars: 0,
    }),
  };
}
