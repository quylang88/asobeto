import type { LessonContent } from "../../world-1-alphabet/map-structure";
import {
  buildVocabIntroVoiceOptions,
  buildVocabSpellingAudio,
  buildWordWithImage,
  type VocabLessonBaseConfig,
} from "./shared";

export function createVocabListenLookLesson(
  config: VocabLessonBaseConfig,
): LessonContent {
  const { lessonId, word, wordAssetKey, reviewLetters } = config;

  return {
    id: lessonId,
    type: "passive",
    lessonKind: "vocab_listen_look",
    title: "Nghe đánh vần và nhìn",
    introVoiceOptions: buildVocabIntroVoiceOptions(1),
    mainAudio: buildVocabSpellingAudio(wordAssetKey),
    mainImage: buildWordWithImage(wordAssetKey),
    targetText: word,
    relatedLetters: reviewLetters,
    scoring: {
      metric: "none",
      passPolicy: "always",
      maxStars: 0,
    },
  };
}
