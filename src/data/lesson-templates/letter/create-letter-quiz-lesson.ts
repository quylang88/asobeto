import type { LessonContent } from "../../world-1-alphabet";
import { withDefaultLessonFeedbackAudio } from "../../scoring-config";
import {
  buildLetterIntroVoiceOptions,
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
    introVoiceOptions: buildLetterIntroVoiceOptions(2),
    mainAudio: buildMainLetterAudio(letterAssetKey),
    answers: createLetterAnswers(letter, distractors),
    targetLetter: normalizedLetter,
    scoring: withDefaultLessonFeedbackAudio({
      metric: "correct_answer",
      passPolicy: "always",
      starThresholds: {
        oneStar: 1,
      },
      maxStars: 1,
    }),
  };
}
