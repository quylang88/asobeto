import type { LessonContent } from "../../world-1-alphabet/map-structure";
import {
  buildLetterIntroVoiceOptions,
  buildMainLetterAudio,
  normalizeLetter,
  type LetterLessonBaseConfig,
} from "./shared";

export interface LetterPronunciationPracticeLessonConfig
  extends LetterLessonBaseConfig {
  title?: string;
  relatedLetters?: string[];
  useAudio?: boolean;
  disableIntro?: boolean;
  passThreshold?: number;
  oneStarThreshold?: number;
  twoStarsThreshold?: number;
  maxStars?: number;
}

export function createLetterPronunciationPracticeLesson(
  config: LetterPronunciationPracticeLessonConfig,
): LessonContent {
  const {
    lessonId,
    letter,
    letterAssetKey,
    title = "Nghe chữ cái và nói lại",
    relatedLetters = [],
    useAudio = true,
    disableIntro = false,
    passThreshold = 0.5,
    oneStarThreshold = 0.5,
    twoStarsThreshold = 0.75,
    maxStars = 2,
  } = config;
  const normalizedLetter = normalizeLetter(letter);

  return {
    id: lessonId,
    type: "active",
    lessonKind: "pronunciation_practice",
    title,
    mainAudio: useAudio ? buildMainLetterAudio(letterAssetKey) : undefined,
    introVoiceOptions:
      useAudio && !disableIntro ? buildLetterIntroVoiceOptions(2) : undefined,
    disableIntro,
    targetText: normalizedLetter,
    targetLetter: normalizedLetter,
    relatedLetters,
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
