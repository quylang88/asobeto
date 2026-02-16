import type { LessonContent } from "../map-structure";
import {
  createLetterPronunciationPracticeLesson,
  createLetterQuizLesson,
  createLetterTracePracticeLesson,
} from "../../lesson-templates/letter";
import {
  createVocabImageQuizLesson,
  createVocabPronunciationPracticeLesson,
  createVocabTracePracticeLesson,
  type VocabImageQuizChoice,
} from "../../lesson-templates/vocab";

interface ReviewLetterOption {
  id: string;
  text: string;
  assetKey: string;
}

type ReviewWordOption = VocabImageQuizChoice;

interface ReviewWordSeed {
  id: string;
  text: string;
  assetKey: string;
}

const REVIEW_LETTERS: ReviewLetterOption[] = [
  { id: "a", text: "a", assetKey: "a" },
  { id: "c", text: "c", assetKey: "c" },
  { id: "n", text: "n", assetKey: "n" },
  { id: "oo", text: "ô", assetKey: "oo" },
  { id: "b", text: "b", assetKey: "b" },
  { id: "o", text: "o", assetKey: "o" },
  { id: "m", text: "m", assetKey: "m" },
  { id: "e", text: "e", assetKey: "e" },
];

const REVIEW_WORD_SEEDS: ReviewWordSeed[] = [
  {
    id: "cas",
    text: "cá",
    assetKey: "cas",
  },
  {
    id: "awn",
    text: "ăn",
    assetKey: "awn",
  },
  {
    id: "boos",
    text: "bố",
    assetKey: "boos",
  },
  {
    id: "bof",
    text: "bò",
    assetKey: "bof",
  },
  {
    id: "mej",
    text: "mẹ",
    assetKey: "mej",
  },
  {
    id: "cor",
    text: "cỏ",
    assetKey: "cor",
  },
];

const REVIEW_WORDS: ReviewWordOption[] = REVIEW_WORD_SEEDS.map((word) => ({
  ...word,
}));

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function pickDistinct<T>(items: T[], count: number): T[] {
  return shuffleArray(items).slice(0, Math.max(0, Math.min(count, items.length)));
}

function getLetterDistractors(correct: ReviewLetterOption): [string, string] {
  const distractors = pickDistinct(
    REVIEW_LETTERS.filter((letter) => letter.id !== correct.id).map(
      (letter) => letter.text,
    ),
    2,
  );

  return [distractors[0] ?? "a", distractors[1] ?? "c"];
}

function getWordDistractors(
  correct: ReviewWordOption,
): [VocabImageQuizChoice, VocabImageQuizChoice] {
  const distractors = pickDistinct(
    REVIEW_WORDS.filter((word) => word.id !== correct.id),
    2,
  );

  return [
    distractors[0] ?? REVIEW_WORDS[0],
    distractors[1] ?? REVIEW_WORDS[1] ?? REVIEW_WORDS[0],
  ];
}

function createBossLetterQuizLesson(
  lessonId: string,
  option: ReviewLetterOption,
): LessonContent {
  const lesson = createLetterQuizLesson({
    lessonId,
    letter: option.text,
    letterAssetKey: option.assetKey,
    distractors: getLetterDistractors(option),
  });

  return {
    ...lesson,
    title: "Nghe và chọn chữ cái đã học",
    disableIntro: true,
    fogMode: "locked",
    scoring: {
      metric: "correct_answer",
      passPolicy: "always",
      maxStars: 1,
      starThresholds: {
        oneStar: 1,
      },
    },
  };
}

function createBossVocabImageQuizLesson(
  lessonId: string,
  option: ReviewWordOption,
): LessonContent {
  return createVocabImageQuizLesson({
    lessonId,
    title: "Nghe và chọn đúng ảnh từ vựng",
    mainAudio: `/assets/audio/words/${option.assetKey}.mp3`,
    correct: option,
    distractors: getWordDistractors(option),
    disableIntro: true,
  });
}

function createBossPronunciationLetterLesson(
  lessonId: string,
  option: ReviewLetterOption,
): LessonContent {
  return createLetterPronunciationPracticeLesson({
    lessonId,
    letter: option.text,
    letterAssetKey: option.assetKey,
    title: "Nhìn chữ cái và nói lại",
    useAudio: false,
    disableIntro: true,
    passThreshold: 0.7,
    oneStarThreshold: 0.7,
    twoStarsThreshold: 0.9,
    maxStars: 1,
  });
}

function createBossPronunciationWordLesson(
  lessonId: string,
  option: ReviewWordOption,
): LessonContent {
  return createVocabPronunciationPracticeLesson({
    lessonId,
    word: option.text,
    wordAssetKey: option.assetKey,
    reviewLetters: [],
    title: "Nhìn từ và nói lại",
    useAudio: false,
    showImage: false,
    disableIntro: true,
    passThreshold: 0.7,
    oneStarThreshold: 0.7,
    twoStarsThreshold: 0.9,
    maxStars: 1,
  });
}

function createBossLetterTracePracticeLesson(
  lessonId: string,
  option: ReviewLetterOption,
): LessonContent {
  const lesson = createLetterTracePracticeLesson({
    lessonId,
    letter: option.text,
    letterAssetKey: option.assetKey,
  });

  return {
    ...lesson,
    title: "Viết lại chữ cái",
    disableIntro: true,
    scoring: {
      metric: "trace_accuracy",
      passPolicy: "threshold",
      passThreshold: 0.7,
      starThresholds: {
        oneStar: 0.7,
        twoStars: 0.95,
      },
      maxStars: 1,
    },
  };
}

function createBossVocabTracePracticeLesson(
  lessonId: string,
  option: ReviewWordOption,
): LessonContent {
  const lesson = createVocabTracePracticeLesson({
    lessonId,
    word: option.text,
    wordAssetKey: option.assetKey,
    reviewLetters: [],
  });

  return {
    ...lesson,
    title: "Viết lại từ vựng",
    disableIntro: true,
    scoring: {
      metric: "trace_accuracy",
      passPolicy: "threshold",
      passThreshold: 0.7,
      starThresholds: {
        oneStar: 0.7,
        twoStars: 0.95,
      },
      maxStars: 1,
    },
  };
}

const [letterQuizA, letterQuizB, speechLetterA, speechLetterB, traceLetterA, traceLetterB] =
  pickDistinct(REVIEW_LETTERS, 6);
const [wordQuizA, wordQuizB, speechWord, traceWord] = pickDistinct(REVIEW_WORDS, 4);

export const floor1Lessons: LessonContent[] = [
  createBossLetterQuizLesson("boss-f1-l1", letterQuizA),
  createBossLetterQuizLesson("boss-f1-l2", letterQuizB),
  createBossVocabImageQuizLesson("boss-f1-l3", wordQuizA),
  createBossVocabImageQuizLesson("boss-f1-l4", wordQuizB),
  createBossPronunciationLetterLesson("boss-f1-l5", speechLetterA),
  createBossPronunciationLetterLesson("boss-f1-l6", speechLetterB),
  createBossPronunciationWordLesson("boss-f1-l7", speechWord),
  createBossLetterTracePracticeLesson("boss-f1-l8", traceLetterA),
  createBossLetterTracePracticeLesson("boss-f1-l9", traceLetterB),
  createBossVocabTracePracticeLesson("boss-f1-l10", traceWord),
];
