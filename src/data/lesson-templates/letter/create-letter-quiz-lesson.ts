import type { LessonContent } from "../../world-1-alphabet/map-structure";
import {
  buildLetterIntroVoice,
  buildMainLetterAudio,
  createLetterAnswers,
  normalizeLetter,
  type LetterQuizLessonConfig,
} from "./shared";

export function createLetterQuizLesson(
  config: LetterQuizLessonConfig,
): LessonContent {
  const { lessonId, letter, letterAssetKey, distractors } = config;
  const normalizedLetter = normalizeLetter(letter);

  return {
    id: lessonId,
    type: "active",
    lessonKind: "letter_quiz",
    title: "Nghe và chọn chữ cái",
    introVoice: buildLetterIntroVoice(letterAssetKey, 2),
    mainAudio: buildMainLetterAudio(letterAssetKey),
    answers: createLetterAnswers(letter, distractors),
    targetLetter: normalizedLetter,
    scoring: {
      metric: "correct_answer",
      passPolicy: "always",
      starThresholds: {
        oneStar: 1,
      },
      maxStars: 1,
    },
  };
}
