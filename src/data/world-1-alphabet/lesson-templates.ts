import {
  LessonAnswer,
  LessonAudioVariant,
  LessonContent,
  WordToken,
} from "./map-structure";

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
  reviewMode?: boolean;
}

function createLetterAudioVariants(
  letterAssetKey: string,
): LessonAudioVariant[] {
  return [
    {
      speed: "slow",
      audio: `/assets/audio/letters/${letterAssetKey}-slow.mp3`,
    },
    {
      speed: "normal",
      audio: `/assets/audio/letters/${letterAssetKey}-normal.mp3`,
    },
    {
      speed: "fast",
      audio: `/assets/audio/letters/${letterAssetKey}-fast.mp3`,
    },
  ];
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
  // Chuẩn hóa chữ cái mục tiêu sang chữ thường để áp dụng cho toàn bộ lesson 1-4
  const normalizedLetter = letter.toLocaleLowerCase();

  return [
    {
      id: `${lessonPrefix}-l1`,
      type: "passive",
      lessonKind: "letter_listen",
      title: `Làm quen chữ cái "${normalizedLetter}"`,
      introVoice: `/assets/audio/intro-letters/${letterAssetKey}-intro-1.mp3`,
      mainAudio: `/assets/audio/letters/${letterAssetKey}-normal.mp3`,
      audioVariants: createLetterAudioVariants(letterAssetKey),
      targetLetter: normalizedLetter,
      gating: {
        requiredAudioPlays: 3,
        requiredPlaybackSpeeds: ["slow", "normal", "fast"],
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
      introVoice: `/assets/audio/intro-letters/${letterAssetKey}-intro-2.mp3`,
      mainAudio: `/assets/audio/letters/${letterAssetKey}-normal.mp3`,
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
      introVoice: `/assets/audio/intro-letters/${letterAssetKey}-intro-3.mp3`,
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
      introVoice: `/assets/audio/intro-letters/${letterAssetKey}-intro-4.mp3`,
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
    reviewMode,
  } = config;
  const reviewPrefix = reviewMode ? "Ôn tập: " : "";
  const isFloor3SpeakingFlow = !reviewMode;
  const introAudioBase = `/assets/audio/intro-words/${wordAssetKey}`;

  return [
    {
      id: `${lessonPrefix}-l1`,
      type: "passive",
      lessonKind: "vocab_listen_look",
      title: isFloor3SpeakingFlow
        ? `${reviewPrefix}Nghe và nhìn`
        : `${reviewPrefix}Nghe và nhìn "${word}"`,
      instruction: isFloor3SpeakingFlow
        ? undefined
        : `Bé hãy nghe và nhìn từ "${word}" nhé.`,
      introVoice: `${introAudioBase}-l1.mp3`,
      mainAudio: `/assets/audio/words/${wordAssetKey}.mp3`,
      mainImage: `/assets/images/${wordAssetKey}.png`,
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
      title: isFloor3SpeakingFlow
        ? `${reviewPrefix}Nghe đánh vần và nói lại`
        : `${reviewPrefix}Nghe và nói lại`,
      instruction: isFloor3SpeakingFlow
        ? undefined
        : `Bé hãy nghe và nói lại từ "${word}".`,
      introVoice: `${introAudioBase}-l2.mp3`,
      mainAudio: isFloor3SpeakingFlow
        ? `/assets/audio/words/${wordAssetKey}-spelling.mp3`
        : `/assets/audio/words/${wordAssetKey}.mp3`,
      mainImage: `/assets/images/${wordAssetKey}-with-word.png`,
      targetText: word,
      relatedLetters: reviewLetters,
      scoring: {
        metric: "speech_similarity",
        passPolicy: isFloor3SpeakingFlow ? "threshold" : "always",
        passThreshold: isFloor3SpeakingFlow ? 0.5 : undefined,
        starThresholds: {
          oneStar: isFloor3SpeakingFlow ? 0.5 : 0.78,
          twoStars: isFloor3SpeakingFlow ? 0.75 : undefined,
        },
        maxStars: isFloor3SpeakingFlow ? 2 : 1,
      },
    },
    {
      id: `${lessonPrefix}-l3`,
      type: "active",
      lessonKind: "vocab_word_build",
      title: `${reviewPrefix}Kéo thả để tạo từ "${word}"`,
      instruction: isFloor3SpeakingFlow
        ? undefined
        : `Bé hãy ghép đúng từ "${word}" nhé.`,
      introVoice: `${introAudioBase}-l3.mp3`,
      question: ``,
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
      title: `${reviewPrefix}Viết từ "${word}"`,
      instruction: isFloor3SpeakingFlow
        ? undefined
        : `Bé hãy viết lại từ "${word}" theo nét mờ.`,
      introVoice: `${introAudioBase}-l4.mp3`,
      mainImage: `/assets/tracing/words/${wordAssetKey}-guide.png`,
      targetText: word,
      relatedLetters: reviewLetters,
      scoring: {
        metric: "trace_accuracy",
        passPolicy: "always",
        starThresholds: {
          oneStar: 0.6,
        },
        maxStars: 1,
      },
    },
  ];
}
