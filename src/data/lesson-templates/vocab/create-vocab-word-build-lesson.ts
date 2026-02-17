import type { LessonContent } from "../../world-1-alphabet/map-structure";
import { withDefaultLessonFeedbackAudio } from "../../scoring-config";
import {
  buildVocabIntroVoiceOptions,
  type VocabWordBuildLessonConfig,
} from "./shared";

export function createVocabWordBuildLesson(
  config: VocabWordBuildLessonConfig,
): LessonContent {
  const {
    lessonId,
    word,
    wordTokens,
    wordTokenPool,
    reviewLetters,
  } = config;

  return {
    id: lessonId,
    type: "active",
    lessonKind: "vocab_word_build",
    title: `Kéo thả để tạo từ "${word}"`,
    introVoiceOptions: buildVocabIntroVoiceOptions(3),
    targetText: word,
    targetTokens: wordTokens,
    tokenPool: wordTokenPool,
    relatedLetters: reviewLetters,
    scoring: withDefaultLessonFeedbackAudio({
      metric: "word_assembly_accuracy",
      passPolicy: "always",
      starThresholds: {
        oneStar: 1,
      },
      maxStars: 1,
    }),
  };
}
