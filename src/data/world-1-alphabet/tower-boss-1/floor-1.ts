import type {
  LessonContent,
  LessonScoring,
  ScoringMetric,
} from "../map-structure";
import {
  BOSS_REVIEW_LESSON_PASS_THRESHOLD,
  createLessonScoring,
  withDefaultLessonFeedbackAudio,
} from "../../scoring-config";
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
import { buildVocabWordAudio } from "../../audio";

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

const BOSS_REVIEW_SCORING_OVERRIDES = {
  passThreshold: BOSS_REVIEW_LESSON_PASS_THRESHOLD,
  maxStars: 0,
  progressMode: "pass_count" as const,
} satisfies Partial<Omit<LessonScoring, "metric">>;

function createBossReviewScoring(metric: ScoringMetric): LessonScoring {
  if (metric === "trace_accuracy" || metric === "speech_similarity") {
    return createLessonScoring(metric, BOSS_REVIEW_SCORING_OVERRIDES);
  }

  return withDefaultLessonFeedbackAudio({
    metric,
    passPolicy: "always",
    maxStars: 0,
    progressMode: "pass_count",
    starThresholds: {
      oneStar: 1,
      twoStars: 1,
    },
  });
}

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
    scoring: createBossReviewScoring("correct_answer"),
  };
}

function createBossVocabImageQuizLesson(
  lessonId: string,
  option: ReviewWordOption,
): LessonContent {
  const lesson = createVocabImageQuizLesson({
    lessonId,
    title: "Nghe và chọn đúng ảnh từ vựng",
    mainAudio: buildVocabWordAudio(option.assetKey),
    correct: option,
    distractors: getWordDistractors(option),
    disableIntro: true,
  });

  return {
    ...lesson,
    scoring: createBossReviewScoring("correct_answer"),
  };
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
    scoringOverrides: BOSS_REVIEW_SCORING_OVERRIDES,
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
    scoringOverrides: BOSS_REVIEW_SCORING_OVERRIDES,
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
    scoring: createBossReviewScoring("trace_accuracy"),
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
    scoring: createBossReviewScoring("trace_accuracy"),
  };
}

// Sinh bộ lesson boss mới mỗi lần gọi để đảm bảo:
// - Bé thoát giữa chừng rồi vào lại: đề sẽ đổi.
// - Bé học lại tháp boss: đề tiếp tục random mới.
export function createBossFloor1Lessons(): LessonContent[] {
  const [
    letterQuizA,
    letterQuizB,
    speechLetterA,
    speechLetterB,
    traceLetterA,
    traceLetterB,
  ] = pickDistinct(REVIEW_LETTERS, 6);
  const [wordQuizA, wordQuizB, speechWord, traceWord] = pickDistinct(
    REVIEW_WORDS,
    4,
  );

  return [
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
}

// Giữ export cũ để không phá các chỗ đang dùng dạng hằng.
export const floor1Lessons: LessonContent[] = createBossFloor1Lessons();
