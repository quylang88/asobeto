import { LessonAnswer, LessonContent } from "../map-structure";

interface ReviewLetterOption {
  id: string;
  text: string;
  audio: string;
}

interface ReviewWordOption {
  id: string;
  text: string;
  audio: string;
  image: string;
}

const FALLBACK_LETTER_AUDIO = "/assets/audio/letters/a.mp3";
const FALLBACK_WORD_AUDIO = "/assets/audio/words/cas.mp3";

const LETTER_AUDIO_BY_ID: Record<string, string> = {
  a: "/assets/audio/letters/a.mp3",
  c: "/assets/audio/letters/c.mp3",
};

const WORD_AUDIO_BY_ID: Record<string, string> = {
  cas: "/assets/audio/words/cas.mp3",
};

const REVIEW_LETTERS: ReviewLetterOption[] = [
  { id: "a", text: "a", audio: LETTER_AUDIO_BY_ID.a ?? FALLBACK_LETTER_AUDIO },
  { id: "c", text: "c", audio: LETTER_AUDIO_BY_ID.c ?? FALLBACK_LETTER_AUDIO },
  {
    id: "aw",
    text: "ă",
    audio: LETTER_AUDIO_BY_ID.aw ?? FALLBACK_LETTER_AUDIO,
  },
  { id: "n", text: "n", audio: LETTER_AUDIO_BY_ID.n ?? FALLBACK_LETTER_AUDIO },
  {
    id: "oo",
    text: "ô",
    audio: LETTER_AUDIO_BY_ID.oo ?? FALLBACK_LETTER_AUDIO,
  },
  { id: "b", text: "b", audio: LETTER_AUDIO_BY_ID.b ?? FALLBACK_LETTER_AUDIO },
  { id: "o", text: "o", audio: LETTER_AUDIO_BY_ID.o ?? FALLBACK_LETTER_AUDIO },
  { id: "m", text: "m", audio: LETTER_AUDIO_BY_ID.m ?? FALLBACK_LETTER_AUDIO },
  { id: "e", text: "e", audio: LETTER_AUDIO_BY_ID.e ?? FALLBACK_LETTER_AUDIO },
];

const REVIEW_WORDS: ReviewWordOption[] = [
  {
    id: "cas",
    text: "cá",
    audio: WORD_AUDIO_BY_ID.cas ?? FALLBACK_WORD_AUDIO,
    image: "/assets/images/review/cas.svg",
  },
  {
    id: "awn",
    text: "ăn",
    audio: WORD_AUDIO_BY_ID.awn ?? FALLBACK_WORD_AUDIO,
    image: "/assets/images/review/awn.svg",
  },
  {
    id: "boos",
    text: "bố",
    audio: WORD_AUDIO_BY_ID.boos ?? FALLBACK_WORD_AUDIO,
    image: "/assets/images/review/boos.svg",
  },
  {
    id: "bof",
    text: "bò",
    audio: WORD_AUDIO_BY_ID.bof ?? FALLBACK_WORD_AUDIO,
    image: "/assets/images/review/bof.svg",
  },
  {
    id: "mej",
    text: "mẹ",
    audio: WORD_AUDIO_BY_ID.mej ?? FALLBACK_WORD_AUDIO,
    image: "/assets/images/review/mej.svg",
  },
  {
    id: "cor",
    text: "cỏ",
    audio: WORD_AUDIO_BY_ID.cor ?? FALLBACK_WORD_AUDIO,
    image: "/assets/images/review/cor.svg",
  },
];

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

function createLetterQuizAnswers(correct: ReviewLetterOption): LessonAnswer[] {
  const distractors = pickDistinct(
    REVIEW_LETTERS.filter((letter) => letter.id !== correct.id),
    2,
  );

  return shuffleArray([
    {
      id: `${correct.id}-correct`,
      text: correct.text,
      isCorrect: true,
    },
    ...distractors.map((letter) => ({
      id: `${correct.id}-distractor-${letter.id}`,
      text: letter.text,
      isCorrect: false,
    })),
  ]);
}

function createWordImageQuizAnswers(correct: ReviewWordOption): LessonAnswer[] {
  const distractors = pickDistinct(
    REVIEW_WORDS.filter((word) => word.id !== correct.id),
    2,
  );

  return shuffleArray([
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
  ]);
}

const [letterQuizA, letterQuizB] = pickDistinct(REVIEW_LETTERS, 2);
const [wordQuizA, wordQuizB, speechWord, traceWord] = pickDistinct(REVIEW_WORDS, 4);
const [speechLetterA, speechLetterB, traceLetterA, traceLetterB] =
  pickDistinct(REVIEW_LETTERS, 4);

export const floor1Lessons: LessonContent[] = [
  {
    id: "boss-f1-l1",
    type: "active",
    lessonKind: "letter_quiz",
    title: "Nghe và chọn chữ cái",
    instruction: "Nghe âm thanh và chọn đúng chữ cái đã học.",
    mainAudio: letterQuizA.audio,
    targetLetter: letterQuizA.text,
    answers: createLetterQuizAnswers(letterQuizA),
    scoring: {
      metric: "correct_answer",
      passPolicy: "always",
      starThresholds: {
        oneStar: 1,
      },
      maxStars: 1,
    },
  },
  {
    id: "boss-f1-l2",
    type: "active",
    lessonKind: "letter_quiz",
    title: "Nghe và chọn chữ cái",
    instruction: "Nghe âm thanh và chọn đúng chữ cái đã học.",
    mainAudio: letterQuizB.audio,
    targetLetter: letterQuizB.text,
    answers: createLetterQuizAnswers(letterQuizB),
    scoring: {
      metric: "correct_answer",
      passPolicy: "always",
      starThresholds: {
        oneStar: 1,
      },
      maxStars: 1,
    },
  },
  {
    id: "boss-f1-l3",
    type: "active",
    lessonKind: "vocab_listen_look",
    title: "Nghe và chọn ảnh từ vựng",
    instruction: "Nghe phát âm và chạm đúng ảnh từ vựng.",
    mainAudio: wordQuizA.audio,
    answers: createWordImageQuizAnswers(wordQuizA),
    scoring: {
      metric: "correct_answer",
      passPolicy: "always",
      starThresholds: {
        oneStar: 1,
      },
      maxStars: 1,
    },
  },
  {
    id: "boss-f1-l4",
    type: "active",
    lessonKind: "vocab_listen_look",
    title: "Nghe và chọn ảnh từ vựng",
    instruction: "Nghe phát âm và chạm đúng ảnh từ vựng.",
    mainAudio: wordQuizB.audio,
    answers: createWordImageQuizAnswers(wordQuizB),
    scoring: {
      metric: "correct_answer",
      passPolicy: "always",
      starThresholds: {
        oneStar: 1,
      },
      maxStars: 1,
    },
  },
  {
    id: "boss-f1-l5",
    type: "active",
    lessonKind: "vocab_listen_repeat",
    title: "Nghe và nói lại chữ cái",
    instruction: "Bấm mic rồi đọc lại chữ cái vừa nghe.",
    mainAudio: speechLetterA.audio,
    targetText: speechLetterA.text,
    scoring: {
      metric: "speech_similarity",
      passPolicy: "threshold",
      passThreshold: 0.6,
      starThresholds: {
        oneStar: 0.6,
        twoStars: 0.85,
      },
      maxStars: 1,
    },
  },
  {
    id: "boss-f1-l6",
    type: "active",
    lessonKind: "vocab_listen_repeat",
    title: "Nghe và nói lại chữ cái",
    instruction: "Bấm mic rồi đọc lại chữ cái vừa nghe.",
    mainAudio: speechLetterB.audio,
    targetText: speechLetterB.text,
    scoring: {
      metric: "speech_similarity",
      passPolicy: "threshold",
      passThreshold: 0.6,
      starThresholds: {
        oneStar: 0.6,
        twoStars: 0.85,
      },
      maxStars: 1,
    },
  },
  {
    id: "boss-f1-l7",
    type: "active",
    lessonKind: "vocab_listen_repeat",
    title: "Nghe và nói lại từ vựng",
    instruction: "Bấm mic rồi đọc lại từ vừa nghe.",
    mainAudio: speechWord.audio,
    targetText: speechWord.text,
    mainImage: speechWord.image,
    scoring: {
      metric: "speech_similarity",
      passPolicy: "threshold",
      passThreshold: 0.6,
      starThresholds: {
        oneStar: 0.6,
        twoStars: 0.85,
      },
      maxStars: 1,
    },
  },
  {
    id: "boss-f1-l8",
    type: "active",
    lessonKind: "letter_trace_practice",
    title: "Viết lại chữ cái",
    instruction: "Viết lại chữ cái theo mẫu.",
    targetText: traceLetterA.text,
    targetLetter: traceLetterA.text,
    scoring: {
      metric: "trace_accuracy",
      passPolicy: "threshold",
      passThreshold: 0.6,
      starThresholds: {
        oneStar: 0.6,
        twoStars: 0.9,
      },
      maxStars: 1,
    },
  },
  {
    id: "boss-f1-l9",
    type: "active",
    lessonKind: "letter_trace_practice",
    title: "Viết lại chữ cái",
    instruction: "Viết lại chữ cái theo mẫu.",
    targetText: traceLetterB.text,
    targetLetter: traceLetterB.text,
    scoring: {
      metric: "trace_accuracy",
      passPolicy: "threshold",
      passThreshold: 0.6,
      starThresholds: {
        oneStar: 0.6,
        twoStars: 0.9,
      },
      maxStars: 1,
    },
  },
  {
    id: "boss-f1-l10",
    type: "active",
    lessonKind: "vocab_trace_practice",
    title: "Viết lại từ vựng",
    instruction: "Viết lại từ vựng theo mẫu.",
    targetText: traceWord.text,
    mainImage: traceWord.image,
    scoring: {
      metric: "trace_accuracy",
      passPolicy: "threshold",
      passThreshold: 0.6,
      starThresholds: {
        oneStar: 0.6,
        twoStars: 0.9,
      },
      maxStars: 1,
    },
  },
];
