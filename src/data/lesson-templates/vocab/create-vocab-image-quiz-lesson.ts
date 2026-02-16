import type {
  LessonAnswer,
  LessonContent,
} from "../../world-1-alphabet/map-structure";
import type { VocabImageQuizChoice } from "./shared";

export interface VocabImageQuizLessonConfig {
  lessonId: string;
  title?: string;
  mainAudio: string;
  correct: VocabImageQuizChoice;
  distractors: [VocabImageQuizChoice, VocabImageQuizChoice];
  disableIntro?: boolean;
}

function shuffleAnswers(answers: LessonAnswer[]): LessonAnswer[] {
  const shuffled = [...answers];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

export function createVocabImageQuizLesson(
  config: VocabImageQuizLessonConfig,
): LessonContent {
  const { lessonId, title, mainAudio, correct, distractors, disableIntro = false } =
    config;

  return {
    id: lessonId,
    type: "active",
    lessonKind: "vocab_image_quiz",
    title: title ?? "Nghe và chọn đúng ảnh từ vựng",
    mainAudio,
    disableIntro,
    targetText: correct.text,
    answers: shuffleAnswers([
      {
        id: `${correct.id}-correct`,
        text: correct.text,
        image: correct.image,
        isCorrect: true,
      },
      ...distractors.map((word) => ({
        id: `${correct.id}-distractor-${word.id}`,
        text: word.text,
        image: word.image,
        isCorrect: false,
      })),
    ]),
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
