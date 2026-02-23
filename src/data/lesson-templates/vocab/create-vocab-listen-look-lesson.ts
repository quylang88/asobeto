import type { LessonContent } from "../../world-1-alphabet";
import { withDefaultLessonFeedbackAudio } from "../../scoring-config";
import {
  buildVocabIntroVoiceOptions,
  buildVocabWordAudio,
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
    title: "Nghe phát âm và nhìn",
    introVoiceOptions: buildVocabIntroVoiceOptions(1),
    mainAudio: buildVocabWordAudio(wordAssetKey),
    mainImage: buildWordWithImage(wordAssetKey),
    targetText: word,
    relatedLetters: reviewLetters,
    scoring: withDefaultLessonFeedbackAudio({
      metric: "none",
      passPolicy: "always",
      maxStars: 0,
    }),
  };
}
