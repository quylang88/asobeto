import type { WordToken } from "../../world-1-alphabet/map-structure";
import {
  buildVocabIntroVoiceOptions,
  buildVocabSpellingAudio,
  buildVocabWordAudio,
} from "../../audio";

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
export {
  buildVocabIntroVoiceOptions,
  buildVocabSpellingAudio,
  buildVocabWordAudio,
};

export function buildWordWithImage(wordAssetKey: string): string {
  return `/assets/images/words/${wordAssetKey}-with-word.webp`;
}

export function buildWordImagePath(wordAssetKey: string): string {
  return `/assets/images/words/${wordAssetKey}.webp`;
}
