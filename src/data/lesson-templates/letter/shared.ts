import type { LessonAnswer } from "../../world-1-alphabet/map-structure";

export type LetterDistractors = [string, string];

export interface LetterLessonBaseConfig {
  lessonId: string;
  letter: string;
  letterAssetKey: string;
}

export interface LetterQuizLessonConfig extends LetterLessonBaseConfig {
  distractors: LetterDistractors;
}

export function normalizeLetter(letter: string): string {
  return letter.toLocaleLowerCase();
}

export function buildLetterIntroVoiceOptions(
  lessonOrder: 1 | 2 | 3 | 4,
): string[] {
  const lessonSlugByOrder: Record<1 | 2 | 3 | 4, string> = {
    1: "listen",
    2: "quiz",
    3: "trace-demo",
    4: "trace-practice",
  };

  const lessonSlug = lessonSlugByOrder[lessonOrder];
  return [1, 2, 3].map(
    (variant) => `/assets/audio/intro-letters/${lessonSlug}-${variant}.mp3`,
  );
}

export function buildMainLetterAudio(letterAssetKey: string): string {
  return `/assets/audio/letters/${letterAssetKey}.mp3`;
}

export function createLetterAnswers(
  letter: string,
  distractors: LetterDistractors,
): LessonAnswer[] {
  // Chuẩn hóa đáp án về chữ thường để UI hiển thị đồng bộ giữa các floor
  const normalizedLetter = normalizeLetter(letter);
  const normalizedDistractors: LetterDistractors = [
    normalizeLetter(distractors[0]),
    normalizeLetter(distractors[1]),
  ];

  return [
    { id: "correct", text: normalizedLetter, isCorrect: true },
    {
      id: "distractor-1",
      text: normalizedDistractors[0],
      isCorrect: false,
    },
    {
      id: "distractor-2",
      text: normalizedDistractors[1],
      isCorrect: false,
    },
  ];
}
