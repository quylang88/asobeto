import type { LessonContent } from "../../world-1-alphabet/map-structure";
import {
  buildVocabIntroVoice,
  buildVocabWordAudio,
  buildWordWithImage,
  type VocabLessonBaseConfig,
} from "./shared";

export function createVocabListenRepeatLesson(
  config: VocabLessonBaseConfig,
): LessonContent {
  const { lessonId, word, wordAssetKey, reviewLetters } = config;

  return {
    id: lessonId,
    type: "active",
    lessonKind: "vocab_listen_repeat",
    title: "Nghe từ vựng và nói lại",
    introVoice: buildVocabIntroVoice(wordAssetKey, 2),
    mainAudio: buildVocabWordAudio(wordAssetKey),
    mainImage: buildWordWithImage(wordAssetKey),
    targetText: word,
    relatedLetters: reviewLetters,
    scoring: {
      metric: "speech_similarity",
      passPolicy: "threshold",
      passThreshold: 0.5,
      starThresholds: {
        oneStar: 0.5,
        twoStars: 0.75,
      },
      maxStars: 2,
    },
  };
}
