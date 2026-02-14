import type { LessonContent } from "../../world-1-alphabet/map-structure";
import { buildVocabIntroVoice, type VocabWordBuildLessonConfig } from "./shared";

export function createVocabWordBuildLesson(
  config: VocabWordBuildLessonConfig,
): LessonContent {
  const {
    lessonId,
    word,
    wordAssetKey,
    wordTokens,
    wordTokenPool,
    reviewLetters,
  } = config;

  return {
    id: lessonId,
    type: "active",
    lessonKind: "vocab_word_build",
    title: `Kéo thả để tạo từ "${word}"`,
    introVoice: buildVocabIntroVoice(wordAssetKey, 3),
    targetText: word,
    targetTokens: wordTokens,
    tokenPool: wordTokenPool,
    relatedLetters: reviewLetters,
    scoring: {
      metric: "word_assembly_accuracy",
      passPolicy: "always",
      starThresholds: {
        oneStar: 1,
      },
      maxStars: 1,
    },
  };
}
