import type { LessonContent } from "@/data/game-config";
import { LETTER_TOP_INSTRUCTION_KINDS } from "./constants";

type LessonKind = LessonContent["lessonKind"];

const TRACE_PRACTICE_KINDS = new Set<NonNullable<LessonKind>>([
  "letter_trace_practice",
  "vocab_trace_practice",
]);
const LARGE_VOCAB_IMAGE_KINDS = new Set<NonNullable<LessonKind>>([
  "vocab_listen_look",
  "vocab_listen_repeat",
]);
const LETTER_GRID_PREVIEW_KINDS = new Set<NonNullable<LessonKind>>([
  "letter_listen",
  "letter_quiz",
]);

export function isTracePracticeLessonKind(kind: LessonKind): boolean {
  return Boolean(kind && TRACE_PRACTICE_KINDS.has(kind));
}

export function isLetterTracePracticeLessonKind(kind: LessonKind): boolean {
  return kind === "letter_trace_practice";
}

export function isVocabTracePracticeLessonKind(kind: LessonKind): boolean {
  return kind === "vocab_trace_practice";
}

export function isWordBuildLessonKind(kind: LessonKind): boolean {
  return kind === "vocab_word_build";
}

export function isLetterTraceDemoLessonKind(kind: LessonKind): boolean {
  return kind === "letter_trace_demo";
}

export function isVocabListenRepeatLessonKind(kind: LessonKind): boolean {
  return kind === "vocab_listen_repeat";
}

export function isFloor3ListenLookLessonKind(
  kind: LessonKind,
  hasInstruction: boolean,
): boolean {
  return kind === "vocab_listen_look" && !hasInstruction;
}

export function shouldUseLargerVocabImageKind(kind: LessonKind): boolean {
  return Boolean(kind && LARGE_VOCAB_IMAGE_KINDS.has(kind));
}

export function shouldPromoteTitleToInstructionKind(kind: LessonKind): boolean {
  return Boolean(kind && LETTER_TOP_INSTRUCTION_KINDS.has(kind));
}

export function isLetterGridPreviewLessonKind(kind: LessonKind): boolean {
  return Boolean(kind && LETTER_GRID_PREVIEW_KINDS.has(kind));
}

export function isFogRevealLessonKind(kind: LessonKind): boolean {
  return kind === "letter_quiz";
}
