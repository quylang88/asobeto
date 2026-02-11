import { LessonAnswer, LessonContent, WordToken } from "./map-structure";

type LetterDistractors = [string, string];

interface LetterFloorLessonConfig {
  lessonPrefix: string;
  letter: string;
  letterAssetKey: string;
  distractors: LetterDistractors;
}

interface VocabFloorLessonConfig {
  lessonPrefix: string;
  word: string;
  wordAssetKey: string;
  wordTokens: WordToken[];
  wordTokenPool: WordToken[];
  reviewLetters: string[];
}

function createLetterAnswers(
  letter: string,
  distractors: LetterDistractors,
): LessonAnswer[] {
  // Chuẩn hóa đáp án về chữ thường để UI hiển thị đồng bộ giữa các floor
  const normalizedLetter = letter.toLocaleLowerCase();
  const normalizedDistractors: LetterDistractors = [
    distractors[0].toLocaleLowerCase(),
    distractors[1].toLocaleLowerCase(),
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

export function createLetterFloorLessons(
  config: LetterFloorLessonConfig,
): LessonContent[] {
  const { lessonPrefix, letter, letterAssetKey, distractors } = config;
  const introAudioBase = `/assets/audio/intro-letters/${letterAssetKey}`;
  const mainLetterAudio = `/assets/audio/letters/${letterAssetKey}.mp3`;
  // Chuẩn hóa chữ cái mục tiêu sang chữ thường để áp dụng cho toàn bộ lesson 1-4
  const normalizedLetter = letter.toLocaleLowerCase();

  return [
    {
      id: `${lessonPrefix}-l1`,
      type: "passive",
      lessonKind: "letter_listen",
      title: `Làm quen chữ cái "${normalizedLetter}"`,
      introVoice: `${introAudioBase}/intro-1.mp3`,
      mainAudio: mainLetterAudio,
      targetLetter: normalizedLetter,
      gating: {
        requiredAudioPlays: 3,
      },
      scoring: {
        metric: "none",
        passPolicy: "always",
        maxStars: 0,
      },
    },
    {
      id: `${lessonPrefix}-l2`,
      type: "active",
      lessonKind: "letter_quiz",
      title: "Nghe và chọn chữ cái",
      introVoice: `${introAudioBase}/intro-2.mp3`,
      mainAudio: mainLetterAudio,
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
    },
    {
      id: `${lessonPrefix}-l3`,
      type: "passive",
      lessonKind: "letter_trace_demo",
      title: `Xem cách viết chữ cái "${normalizedLetter}"`,
      introVoice: `${introAudioBase}/intro-3.mp3`,
      targetLetter: normalizedLetter,
      targetText: normalizedLetter,
      gating: {
        requireAnimationComplete: true,
      },
      scoring: {
        metric: "none",
        passPolicy: "always",
        maxStars: 0,
      },
    },
    {
      id: `${lessonPrefix}-l4`,
      type: "active",
      lessonKind: "letter_trace_practice",
      title: `Viết lại chữ cái "${normalizedLetter}"`,
      introVoice: `${introAudioBase}/intro-4.mp3`,
      targetLetter: normalizedLetter,
      targetText: normalizedLetter,
      scoring: {
        metric: "trace_accuracy",
        passPolicy: "always",
        starThresholds: {
          oneStar: 0.5,
          twoStars: 0.75,
        },
        maxStars: 2,
      },
    },
  ];
}

export function createVocabFloorLessons(
  config: VocabFloorLessonConfig,
): LessonContent[] {
  const {
    lessonPrefix,
    word,
    wordAssetKey,
    wordTokens,
    wordTokenPool,
    reviewLetters,
  } = config;
  const listenRepeatAudio = `/assets/audio/intro-words/${wordAssetKey}/spelling.mp3`;
  const introAudioBase = `/assets/audio/intro-words/${wordAssetKey}`;
  const vocabWordAudio = `/assets/audio/words/${wordAssetKey}.mp3`;
  const withWordImage = `/assets/images/${wordAssetKey}-with-word.webp`;

  return [
    {
      id: `${lessonPrefix}-l1`,
      type: "passive",
      lessonKind: "vocab_listen_look",
      title: "Nghe đánh vần và nhìn",
      introVoice: `${introAudioBase}/intro-1.mp3`,
      mainAudio: listenRepeatAudio,
      mainImage: withWordImage,
      targetText: word,
      relatedLetters: reviewLetters,
      scoring: {
        metric: "none",
        passPolicy: "always",
        maxStars: 0,
      },
    },
    {
      id: `${lessonPrefix}-l2`,
      type: "active",
      lessonKind: "vocab_listen_repeat",
      title: "Nghe từ vựng và nói lại",
      introVoice: `${introAudioBase}/intro-2.mp3`,
      mainAudio: vocabWordAudio,
      mainImage: withWordImage,
      targetText: word,
      relatedLetters: reviewLetters,
      scoring: {
        metric: "speech_similarity",
        passPolicy: "threshold",
        passThreshold: 0.5,
        starThresholds: {
          oneStar: 0.5,
          twoStars: 0.75,
        },
        maxStars: 2,
      },
    },
    {
      id: `${lessonPrefix}-l3`,
      type: "active",
      lessonKind: "vocab_word_build",
      title: `Kéo thả để tạo từ "${word}"`,
      introVoice: `${introAudioBase}/intro-3.mp3`,
      targetText: word,
      targetTokens: wordTokens,
      tokenPool: wordTokenPool,
      relatedLetters: reviewLetters,
      scoring: {
        metric: "word_assembly_accuracy",
        passPolicy: "always",
        starThresholds: {
          oneStar: 1,
        },
        maxStars: 1,
      },
    },
    {
      id: `${lessonPrefix}-l4`,
      type: "active",
      lessonKind: "vocab_trace_practice",
      title: `Viết từ "${word}"`,
      introVoice: `${introAudioBase}/intro-4.mp3`,
      mainImage: `/assets/tracing/words/${wordAssetKey}-guide.webp`,
      targetText: word,
      relatedLetters: reviewLetters,
      scoring: {
        metric: "trace_accuracy",
        passPolicy: "always",
        starThresholds: {
          oneStar: 0.5,
          twoStars: 0.75,
        },
        maxStars: 2,
      },
    },
  ];
}
