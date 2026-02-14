import {
  CowGrassFeedLevelConfig,
  CowGrassFeedLevelId,
  DiacriticBuildLevelConfig,
  DiacriticBuildInteractionMode,
  DiacriticBuildLevelId,
  MemoryFlipCardBackOption,
  MemoryFlipCardToken,
  MemoryFlipLevelConfig,
  MemoryFlipLevelId,
  LessonAnswer,
  LessonContent,
  WordToken,
} from "./map-structure";
import {
  COW_GRASS_GAME_INSTRUCTION,
  COW_GRASS_GAME_TITLE,
  createCowGrassFeedGameConfig,
} from "../mini-games/cow-grass-feed";
import {
  BUBBLE_GAME_INSTRUCTION,
  BUBBLE_GAME_TITLE,
  createBubblePopGameConfig,
} from "../mini-games/bubble-pop";
import {
  DIACRITIC_BUILD_GAME_INSTRUCTION,
  DIACRITIC_BUILD_GAME_TITLE,
  createDiacriticBuildGameConfig,
} from "../mini-games/diacritic-build";
import {
  MEMORY_FLIP_GAME_INSTRUCTION,
  MEMORY_FLIP_GAME_TITLE,
  createMemoryFlipGameConfig,
} from "../mini-games/memory-flip";

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

interface CowGrassFeedFloorLessonConfig {
  lessonPrefix: string;
  title?: string;
  headerTitle?: string;
  instruction?: string;
  rules?: string[];
  sentenceTokens?: string[];
  correctWord?: string;
  distractorWords?: [string, string, string];
  antiRepeatMaxDistractorStreak?: number;
  antiRepeatMaxCorrectSideStreak?: number;
  tutorialDurationMs?: number;
  levelOverrides?: Partial<
    Record<CowGrassFeedLevelId, Partial<CowGrassFeedLevelConfig>>
  >;
}

interface MemoryFlipFloorLessonConfig {
  lessonPrefix: string;
  pairTarget?: number;
  levelTokenPools?: Partial<Record<MemoryFlipLevelId, MemoryFlipCardToken[]>>;
  cardBackOptions?: MemoryFlipCardBackOption[];
  title?: string;
  headerTitle?: string;
  instruction?: string;
  rules?: string[];
  levelOverrides?: Partial<
    Record<MemoryFlipLevelId, Partial<MemoryFlipLevelConfig>>
  >;
}

interface DiacriticBuildFloorLessonConfig {
  lessonPrefix: string;
  targetLetter: string;
  baseLetter: string;
  markerSymbol: string;
  debrisSymbols: string[];
  interactionMode?: DiacriticBuildInteractionMode;
  catcherHitboxScale?: number;
  title?: string;
  headerTitle?: string;
  instruction?: string;
  rules?: string[];
  minSpawnVerticalGap?: number;
  tutorialDurationMs?: number;
  levelOverrides?: Partial<
    Record<DiacriticBuildLevelId, Partial<DiacriticBuildLevelConfig>>
  >;
  countdownHintText?: string;
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
      bubblePopGame: createBubblePopGameConfig({
        targetLetters,
        targetAudioByLetter,
      }),
    },
  ];
}

export function createCowGrassFeedChallengeLessons(
  config: CowGrassFeedFloorLessonConfig,
): LessonContent[] {
  const {
    lessonPrefix,
    title,
    headerTitle,
    instruction,
    rules,
    sentenceTokens,
    correctWord,
    distractorWords,
    antiRepeatMaxDistractorStreak,
    antiRepeatMaxCorrectSideStreak,
    tutorialDurationMs,
    levelOverrides,
  } = config;

  return [
    {
      id: `${lessonPrefix}-cow-grass-feed`,
      type: "active",
      lessonKind: "cow_grass_feed_challenge",
      title: COW_GRASS_GAME_TITLE,
      instruction: COW_GRASS_GAME_INSTRUCTION,
      scoring: {
        metric: "none",
        passPolicy: "always",
        maxStars: 6,
      },
      cowGrassFeedGame: createCowGrassFeedGameConfig({
        title,
        headerTitle,
        instruction,
        rules,
        sentenceTokens,
        correctWord,
        distractorWords,
        antiRepeatMaxDistractorStreak,
        antiRepeatMaxCorrectSideStreak,
        tutorialDurationMs,
        levelOverrides,
      }),
    },
  ];
}

export function createMemoryFlipChallengeLessons(
  config: MemoryFlipFloorLessonConfig,
): LessonContent[] {
  const {
    lessonPrefix,
    pairTarget,
    levelTokenPools,
    cardBackOptions,
    title,
    headerTitle,
    instruction,
    rules,
    levelOverrides,
  } = config;

  return [
    {
      id: `${lessonPrefix}-memory-flip`,
      type: "active",
      lessonKind: "memory_flip_challenge",
      title: MEMORY_FLIP_GAME_TITLE,
      instruction: MEMORY_FLIP_GAME_INSTRUCTION,
      scoring: {
        metric: "none",
        passPolicy: "always",
        maxStars: 6,
      },
      memoryFlipGame: createMemoryFlipGameConfig({
        pairTarget,
        levelTokenPools,
        cardBackOptions,
        title,
        headerTitle,
        instruction,
        rules,
        levelOverrides,
      }),
    },
  ];
}

export function createDiacriticBuildChallengeLessons(
  config: DiacriticBuildFloorLessonConfig,
): LessonContent[] {
  const {
    lessonPrefix,
    targetLetter,
    baseLetter,
    markerSymbol,
    debrisSymbols,
    interactionMode,
    catcherHitboxScale,
    title,
    headerTitle,
    instruction,
    rules,
    minSpawnVerticalGap,
    tutorialDurationMs,
    countdownHintText,
    levelOverrides,
  } = config;

  return [
    {
      id: `${lessonPrefix}-diacritic-build`,
      type: "active",
      lessonKind: "diacritic_build_challenge",
      title: DIACRITIC_BUILD_GAME_TITLE,
      instruction: DIACRITIC_BUILD_GAME_INSTRUCTION,
      scoring: {
        metric: "none",
        passPolicy: "always",
        maxStars: 6,
      },
      diacriticBuildGame: createDiacriticBuildGameConfig({
        targetLetter,
        baseLetter,
        markerSymbol,
        debrisSymbols,
        interactionMode,
        catcherHitboxScale,
        title,
        headerTitle,
        instruction,
        rules,
        minSpawnVerticalGap,
        tutorialDurationMs,
        countdownHintText,
        levelOverrides,
      }),
    },
  ];
}
