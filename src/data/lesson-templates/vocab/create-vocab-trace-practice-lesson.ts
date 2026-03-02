import type { LessonContent } from "../../world-1-alphabet";
import { createLessonScoring } from "../../scoring-config";
import {
  buildVocabIntroVoiceOptions,
  type VocabLessonBaseConfig,
} from "./shared";

export function createVocabTracePracticeLesson(
  config: VocabLessonBaseConfig,
): LessonContent {
  const { lessonId, word, reviewLetters } = config;

  return {
    id: lessonId,
    type: "active",
    lessonKind: "vocab_trace_practice",
    title: `Viết từ "${word}"`,
    introVoiceOptions: buildVocabIntroVoiceOptions(4),
    targetText: word,
    relatedLetters: reviewLetters,
    scoring: createLessonScoring("trace_accuracy"),
  };
}
