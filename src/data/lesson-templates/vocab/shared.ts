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

export function buildVocabIntroVoice(
  wordAssetKey: string,
  lessonOrder: 1 | 2 | 3 | 4,
): string {
  return `/assets/audio/intro-words/${wordAssetKey}/intro-${lessonOrder}.mp3`;
}

export function buildVocabWordAudio(wordAssetKey: string): string {
  return `/assets/audio/words/${wordAssetKey}.mp3`;
}

export function buildVocabSpellingAudio(wordAssetKey: string): string {
  return `/assets/audio/intro-words/${wordAssetKey}/spelling.mp3`;
}

export function buildWordWithImage(wordAssetKey: string): string {
  return `/assets/images/${wordAssetKey}-with-word.webp`;
}

export function buildWordTraceGuideImage(wordAssetKey: string): string {
  return `/assets/tracing/words/${wordAssetKey}-guide.webp`;
}
