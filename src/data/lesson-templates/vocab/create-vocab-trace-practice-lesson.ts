import type { LessonContent } from "../../world-1-alphabet/map-structure";
import {
  buildVocabIntroVoice,
  type VocabLessonBaseConfig,
} from "./shared";

export function createVocabTracePracticeLesson(
  config: VocabLessonBaseConfig,
): LessonContent {
  const { lessonId, word, wordAssetKey, reviewLetters } = config;

  return {
    id: lessonId,
    type: "active",
    lessonKind: "vocab_trace_practice",
    title: `Viết từ "${word}"`,
    introVoice: buildVocabIntroVoice(wordAssetKey, 4),
    targetText: word,
    relatedLetters: reviewLetters,
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
