import type { WordToken } from "../../world-1-alphabet/map-structure";

export interface VocabLessonBaseConfig {
  lessonId: string;
  word: string;
  wordAssetKey: string;
  reviewLetters: string[];
}

export interface VocabWordBuildLessonConfig extends VocabLessonBaseConfig {
  wordTokens: WordToken[];
  wordTokenPool: WordToken[];
}

export interface VocabImageQuizChoice {
  id: string;
  text: string;
  assetKey: string;
  image?: string;
}

export function buildVocabIntroVoiceOptions(
  lessonOrder: 1 | 2 | 3 | 4,
): string[] {
  const lessonSlugByOrder: Record<1 | 2 | 3 | 4, string> = {
    1: "listen-look",
    2: "pronunciation-practice",
    3: "word-build",
    4: "trace-practice",
  };

  const lessonSlug = lessonSlugByOrder[lessonOrder];
  return [1, 2, 3].map(
    (variant) => `/assets/audio/intro-words/${lessonSlug}-${variant}.mp3`,
  );
}

export function buildVocabWordAudio(wordAssetKey: string): string {
  return `/assets/audio/words/${wordAssetKey}.mp3`;
}

export function buildVocabSpellingAudio(wordAssetKey: string): string {
  return `/assets/audio/intro-words/${wordAssetKey}/spelling.mp3`;
}

export function buildWordWithImage(wordAssetKey: string): string {
  return `/assets/images/words/${wordAssetKey}-with-word.webp`;
}

export function buildWordImagePath(wordAssetKey: string): string {
  return `/assets/images/words/${wordAssetKey}.webp`;
}
