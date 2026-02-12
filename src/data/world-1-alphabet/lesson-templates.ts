import { BUBBLE_PASS_STAR_RULES_BY_LEVEL } from "./bubble-star-rules";
import {
  BubblePassStarRule,
  BubblePopLevelConfig,
  BubblePopLevelId,
  LessonAnswer,
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
}

interface BubblePopFloorLessonConfig {
  lessonPrefix: string;
  targetLetters: [string, string];
  targetAudioByLetter?: Record<string, string>;
}

const BUBBLE_GAME_TITLE = "Thử thách bóng bay chữ";
const BUBBLE_GAME_INSTRUCTION = "Chạm đúng bóng bay chữ theo yêu cầu để săn sao.";
const BUBBLE_GAME_RULES_TEXT = "Bé hãy chạm vào bóng bay chữ cái theo yêu cầu.";

interface BubbleLevelPreset {
  id: BubblePopLevelId;
  label: string;
  starsReward: 1 | 2 | 3;
  passStarRules?: BubblePassStarRule[];
  durationSeconds: number;
  targetScore: number;
  minLivesToPass: number;
  targetBubbleRatio: number;
  emptyBubbleRatio: number;
  bubbleSize: number;
  spawnIntervalMs: {
    min: number;
    max: number;
  };
  speedRange: {
    min: number;
    max: number;
  };
  allowPairSpawn?: boolean;
  pairSpawnChance?: number;
}

const BUBBLE_LEVEL_PRESETS: BubbleLevelPreset[] = [
  {
    id: "easy",
    label: "Dễ",
    starsReward: 1,
    durationSeconds: 35,
    targetScore: 10,
    minLivesToPass: 3,
    targetBubbleRatio: 0.8,
    emptyBubbleRatio: 0.1,
    bubbleSize: 112,
    spawnIntervalMs: {
      min: 860,
      max: 1040,
    },
    speedRange: {
      min: 62,
      max: 88,
    },
  },
  {
    id: "normal",
    label: "Vừa",
    starsReward: 2,
    passStarRules: BUBBLE_PASS_STAR_RULES_BY_LEVEL.normal,
    durationSeconds: 35,
    targetScore: 15,
    minLivesToPass: 2,
    targetBubbleRatio: 0.6,
    emptyBubbleRatio: 0.12,
    bubbleSize: 96,
    spawnIntervalMs: {
      min: 720,
      max: 900,
    },
    speedRange: {
      min: 90,
      max: 126,
    },
  },
  {
    id: "hard",
    label: "Khó",
    starsReward: 3,
    passStarRules: BUBBLE_PASS_STAR_RULES_BY_LEVEL.hard,
    durationSeconds: 30,
    targetScore: 20,
    minLivesToPass: 2,
    targetBubbleRatio: 0.5,
    emptyBubbleRatio: 0.1,
    bubbleSize: 82,
    spawnIntervalMs: {
      min: 600,
      max: 760,
    },
    speedRange: {
      min: 126,
      max: 182,
    },
    allowPairSpawn: true,
    pairSpawnChance: 0.25,
  },
];

function createBubbleLevelConfigs(): BubblePopLevelConfig[] {
  return BUBBLE_LEVEL_PRESETS.map((level) => ({
    ...level,
    spawnIntervalMs: {
      ...level.spawnIntervalMs,
    },
    speedRange: {
      ...level.speedRange,
    },
    passStarRules: level.passStarRules ? [...level.passStarRules] : undefined,
  }));
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

export function createBubblePopChallengeLessons(
  config: BubblePopFloorLessonConfig,
): LessonContent[] {
  const { lessonPrefix, targetLetters, targetAudioByLetter } = config;

  return [
    {
      id: `${lessonPrefix}-bubble-pop`,
      type: "active",
      lessonKind: "bubble_pop_challenge",
      title: BUBBLE_GAME_TITLE,
      instruction: BUBBLE_GAME_INSTRUCTION,
      scoring: {
        metric: "none",
        passPolicy: "always",
        maxStars: 6,
      },
      bubblePopGame: {
        title: "Chọn mức độ",
        headerTitle: "Bóng bay chữ cái",
        instruction: BUBBLE_GAME_RULES_TEXT,
        rules: ["Chạm đúng bóng bay chữ theo yêu cầu."],
        rulesAudioText: BUBBLE_GAME_RULES_TEXT,
        introAudio: "/assets/audio/game/bubble-pop/intro.mp3",
        rulesAudio: "/assets/audio/game/bubble-pop/rules.mp3",
        targetAudioByLetter,
        startLives: 3,
        targetLetters,
        laneCount: 5,
        minSpawnVerticalGap: 94,
        levels: createBubbleLevelConfigs(),
      },
    },
  ];
}
