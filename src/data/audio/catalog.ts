export const AUDIO = {
  FEEDBACK: {
    SUCCESS_ANSWER: "/assets/audio/feedback/success-answer.mp3",
    WRONG_ANSWER: "/assets/audio/feedback/wrong-answer.mp3",
    TRY_AGAIN: "/assets/audio/feedback/try-again.mp3",
    APPLAUSE_CHEERING: "/assets/audio/feedback/applause-cheering.mp3",
  },
  GAME: {
    COMMON: {
      POP: "/assets/audio/game/common/pop.mp3",
    },
    ANIMAL_FEED: {
      EATING_GRASS: "/assets/audio/game/animal-feed/eating-grass.mp3",
    },
    BUBBLE_POP: {
      INTRO: "/assets/audio/game/bubble-pop/intro.mp3",
      TARGET_BY_LETTER: {
        a: "/assets/audio/game/bubble-pop/target-a.mp3",
        c: "/assets/audio/game/bubble-pop/target-c.mp3",
      },
    },
    MEMORY_FLIP: {
      FLIP: "/assets/audio/game/memory-flip/whoosh.mp3",
      MATCH: "/assets/audio/game/memory-flip/ding-correct.mp3",
      MISMATCH: "/assets/audio/game/memory-flip/wrong-bop.mp3",
    },
  },
} as const;

export const AUDIO_TEMPLATES = {
  LETTER_MAIN: "/assets/audio/letters/{letterAssetKey}.mp3",
  LETTER_INTRO_VARIANT:
    "/assets/audio/intro-letters/{lessonSlug}-{variant}.mp3",
  VOCAB_MAIN: "/assets/audio/words/{wordAssetKey}.mp3",
  VOCAB_INTRO_VARIANT: "/assets/audio/intro-words/{lessonSlug}-{variant}.mp3",
  VOCAB_SPELLING: "/assets/audio/intro-words/{wordAssetKey}/spelling.mp3",
} as const;

type IntroLessonOrder = 1 | 2 | 3 | 4;
type IntroVoiceVariant = 1 | 2 | 3;

const INTRO_VOICE_VARIANTS: IntroVoiceVariant[] = [1, 2, 3];

const LETTER_INTRO_SLUG_BY_ORDER: Record<IntroLessonOrder, string> = {
  1: "listen",
  2: "quiz",
  3: "trace-demo",
  4: "trace-practice",
};

const VOCAB_INTRO_SLUG_BY_ORDER: Record<IntroLessonOrder, string> = {
  1: "listen-look",
  2: "pronunciation-practice",
  3: "word-build",
  4: "trace-practice",
};

function applyAudioTemplate(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce((resolved, [key, value]) => {
    return resolved.replace(`{${key}}`, String(value));
  }, template);
}

export function buildMainLetterAudio(letterAssetKey: string): string {
  return applyAudioTemplate(AUDIO_TEMPLATES.LETTER_MAIN, { letterAssetKey });
}

export function buildLetterIntroVoiceOptions(
  lessonOrder: IntroLessonOrder,
): string[] {
  const lessonSlug = LETTER_INTRO_SLUG_BY_ORDER[lessonOrder];
  return INTRO_VOICE_VARIANTS.map((variant) =>
    applyAudioTemplate(AUDIO_TEMPLATES.LETTER_INTRO_VARIANT, {
      lessonSlug,
      variant,
    }),
  );
}

export function buildVocabWordAudio(wordAssetKey: string): string {
  return applyAudioTemplate(AUDIO_TEMPLATES.VOCAB_MAIN, { wordAssetKey });
}

export function buildVocabIntroVoiceOptions(
  lessonOrder: IntroLessonOrder,
): string[] {
  const lessonSlug = VOCAB_INTRO_SLUG_BY_ORDER[lessonOrder];
  return INTRO_VOICE_VARIANTS.map((variant) =>
    applyAudioTemplate(AUDIO_TEMPLATES.VOCAB_INTRO_VARIANT, {
      lessonSlug,
      variant,
    }),
  );
}

export function buildVocabSpellingAudio(wordAssetKey: string): string {
  return applyAudioTemplate(AUDIO_TEMPLATES.VOCAB_SPELLING, { wordAssetKey });
}
