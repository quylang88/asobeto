import type { LessonContent } from "@/data/game-config";

export type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

export type SpeechRecognitionResultEventLike = {
  results: ArrayLike<{
    0?: {
      transcript?: string;
    };
  }>;
};

export type SpeechRecognitionErrorEventLike = {
  error?: string;
};

export type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

export type WordBuildToken = NonNullable<LessonContent["targetTokens"]>[number];

export interface WordBuildSlotPlacement {
  slotIndex: number;
  column: number;
  row: 0 | 1 | 2;
}

export interface WordBuildActiveDrag {
  tokenId: string;
  sourceSlotIndex: number | null;
}
