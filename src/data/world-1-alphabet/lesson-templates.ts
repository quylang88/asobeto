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

function createLetterAudioVariants(letterAssetKey: string): LessonAudioVariant[] {
  return [
    { speed: "slow", audio: `/assets/audio/letters/${letterAssetKey}-slow.mp3` },
    {
      speed: "normal",
      audio: `/assets/audio/letters/${letterAssetKey}-normal.mp3`,
    },
    { speed: "fast", audio: `/assets/audio/letters/${letterAssetKey}-fast.mp3` },
  ];
}

function createLetterAnswers(
  letter: string,
  distractors: LetterDistractors,
): LessonAnswer[] {
  return [
    { id: "correct", text: letter, isCorrect: true },
    { id: "distractor-1", text: distractors[0], isCorrect: false },
    { id: "distractor-2", text: distractors[1], isCorrect: false },
  ];
}

export function createLetterFloorLessons(
  config: LetterFloorLessonConfig,
): LessonContent[] {
  const { lessonPrefix, letter, letterAssetKey, distractors } = config;

  return [
    {
      id: `${lessonPrefix}-l1`,
      type: "passive",
      lessonKind: "letter_listen",
      title: `Làm quen chữ ${letter}`,
      instruction: `Bé hãy lắng nghe thật kỹ cách phát âm chữ cái "${letter}".`,
      introVoice: `/assets/audio/intro/${letter}.mp3`,
      mainAudio: `/assets/audio/letters/${letterAssetKey}-normal.mp3`,
      audioVariants: createLetterAudioVariants(letterAssetKey),
      targetLetter: letter,
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
      title: `Nghe và chọn chữ ${letter}`,
      instruction: "Bé hãy nghe thật kỹ rồi chọn chữ cái đúng nha.",
      introVoice: `/assets/audio/intro/${letter}.mp3`,
      question: `Chữ "${letter}" ở đâu nhỉ?`,
      mainAudio: `/assets/audio/letters/${letterAssetKey}-normal.mp3`,
      answers: createLetterAnswers(letter, distractors),
      targetLetter: letter,
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
      title: `Xem viết chữ ${letter}`,
      instruction: `Bé hãy nhìn kỹ cách viết chữ cái "${letter}".`,
      introVoice: `/assets/audio/intro/${letter}.mp3`,
      mainImage: `/assets/tracing/letters/${letterAssetKey}-demo.gif`,
      targetLetter: letter,
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
      title: `Viết lại chữ ${letter}`,
      instruction: `Bé hãy viết lại chữ cái "${letter}" theo nét mờ nhé.`,
      introVoice: `/assets/audio/intro/${letter}.mp3`,
      targetLetter: letter,
      targetText: letter.toLocaleLowerCase(),
      scoring: {
        metric: "trace_accuracy",
        passPolicy: "always",
        starThresholds: {
          oneStar: 0.5,
          twoStars: 0.85,
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

  return [
    {
      id: `${lessonPrefix}-l1`,
      type: "passive",
      lessonKind: "vocab_listen_look",
      title: `${reviewPrefix}Nghe và nhìn "${word}"`,
      instruction: `Bé hãy nghe và nhìn từ "${word}" nhé.`,
      introVoice: `Bé hãy nghe và nhìn từ "${word}" nhé.`,
      mainAudio: `/assets/audio/words/${wordAssetKey}.mp3`,
      mainImage: `/assets/images/words/${wordAssetKey}.png`,
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
      title: `${reviewPrefix}Nghe và nói lại`,
      instruction: `Bé hãy nghe và nói lại từ "${word}".`,
      introVoice: `Bé hãy nghe và nói lại từ "${word}".`,
      mainAudio: `/assets/audio/words/${wordAssetKey}.mp3`,
      targetText: word,
      relatedLetters: reviewLetters,
      scoring: {
        metric: "speech_similarity",
        passPolicy: "always",
        starThresholds: {
          oneStar: 0.78,
        },
        maxStars: 1,
      },
    },
    {
      id: `${lessonPrefix}-l3`,
      type: "active",
      lessonKind: "vocab_word_build",
      title: `${reviewPrefix}Ghép từ`,
      instruction: `Bé hãy ghép đúng từ "${word}" nhé.`,
      introVoice: `Bé hãy ghép đúng từ "${word}" nhé.`,
      question: `Kéo thả để tạo từ "${word}"`,
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
      instruction: `Bé hãy viết lại từ "${word}" theo nét mờ.`,
      introVoice: `Bé hãy viết lại từ "${word}" theo nét mờ.`,
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
