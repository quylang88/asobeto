import type {
  LessonContent,
  LessonScoring,
} from "../../world-1-alphabet/map-structure";
import { createLessonScoring } from "../../scoring-config";
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
  scoringOverrides?: Partial<Omit<LessonScoring, "metric">>;
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
    scoringOverrides,
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
    scoring: createLessonScoring("speech_similarity", scoringOverrides),
  };
}
