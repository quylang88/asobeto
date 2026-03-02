import type {
  LessonContent,
  LessonScoring,
} from "../../world-1-alphabet";
import { createLessonScoring } from "../../scoring-config";
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
  scoringOverrides?: Partial<Omit<LessonScoring, "metric">>;
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
    scoringOverrides,
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
    scoring: createLessonScoring("speech_similarity", scoringOverrides),
  };
}
