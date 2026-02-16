import type { LessonContent } from "../../world-1-alphabet/map-structure";
import {
  buildVocabIntroVoiceOptions,
  buildVocabWordAudio,
  buildWordWithImage,
  type VocabLessonBaseConfig,
} from "./shared";

export interface VocabPronunciationPracticeLessonConfig
  extends VocabLessonBaseConfig {
  title?: string;
  useAudio?: boolean;
  showImage?: boolean;
  disableIntro?: boolean;
  passThreshold?: number;
  oneStarThreshold?: number;
  twoStarsThreshold?: number;
  maxStars?: number;
}

export function createVocabPronunciationPracticeLesson(
  config: VocabPronunciationPracticeLessonConfig,
): LessonContent {
  const {
    lessonId,
    word,
    wordAssetKey,
    reviewLetters,
    title = "Nghe từ vựng và nói lại",
    useAudio = true,
    showImage = true,
    disableIntro = false,
    passThreshold = 0.5,
    oneStarThreshold = 0.5,
    twoStarsThreshold = 0.75,
    maxStars = 2,
  } = config;

  return {
    id: lessonId,
    type: "active",
    lessonKind: "pronunciation_practice",
    title,
    mainImage: showImage ? buildWordWithImage(wordAssetKey) : undefined,
    mainAudio: useAudio ? buildVocabWordAudio(wordAssetKey) : undefined,
    introVoiceOptions:
      useAudio && !disableIntro ? buildVocabIntroVoiceOptions(2) : undefined,
    disableIntro,
    targetText: word,
    relatedLetters: reviewLetters,
    scoring: {
      metric: "speech_similarity",
      passPolicy: "threshold",
      passThreshold,
      starThresholds: {
        oneStar: oneStarThreshold,
        twoStars: twoStarsThreshold,
      },
      maxStars,
    },
  };
}
