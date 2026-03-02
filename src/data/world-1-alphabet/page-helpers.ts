import type { LessonContent, WordToken } from "./types";
import {
  createAnimalFeedChallengeLesson,
  createBubblePopChallengeLesson,
  createDiacriticBuildChallengeLesson,
  createMemoryFlipChallengeLesson,
} from "../lesson-templates/challenges";
import {
  createLetterListenLesson,
  createLetterQuizLesson,
  createLetterTraceDemoLesson,
  createLetterTracePracticeLesson,
} from "../lesson-templates/letter";
import {
  createVocabListenLookLesson,
  createVocabPronunciationPracticeLesson,
  createVocabTracePracticeLesson,
  createVocabWordBuildLesson,
} from "../lesson-templates/vocab";

export function createLetterFloorLessons({
  lessonPrefix,
  letter,
  letterAssetKey,
  distractors,
}: {
  lessonPrefix: string;
  letter: string;
  letterAssetKey: string;
  distractors: [string, string];
}): LessonContent[] {
  return [
    createLetterListenLesson({
      lessonId: `${lessonPrefix}-l1`,
      letter,
      letterAssetKey,
    }),
    createLetterQuizLesson({
      lessonId: `${lessonPrefix}-l2`,
      letter,
      letterAssetKey,
      distractors,
    }),
    createLetterTraceDemoLesson({
      lessonId: `${lessonPrefix}-l3`,
      letter,
      letterAssetKey,
    }),
    createLetterTracePracticeLesson({
      lessonId: `${lessonPrefix}-l4`,
      letter,
      letterAssetKey,
    }),
  ];
}

export function createVocabularyFloorLessons({
  lessonPrefix,
  word,
  wordAssetKey,
  wordTokens,
  wordTokenPool,
  reviewLetters,
}: {
  lessonPrefix: string;
  word: string;
  wordAssetKey: string;
  wordTokens: WordToken[];
  wordTokenPool: WordToken[];
  reviewLetters: string[];
}): LessonContent[] {
  return [
    createVocabListenLookLesson({
      lessonId: `${lessonPrefix}-l1`,
      word,
      wordAssetKey,
      reviewLetters,
    }),
    createVocabPronunciationPracticeLesson({
      lessonId: `${lessonPrefix}-l2`,
      word,
      wordAssetKey,
      reviewLetters,
    }),
    createVocabWordBuildLesson({
      lessonId: `${lessonPrefix}-l3`,
      word,
      wordAssetKey,
      wordTokens,
      wordTokenPool,
      reviewLetters,
    }),
    createVocabTracePracticeLesson({
      lessonId: `${lessonPrefix}-l4`,
      word,
      wordAssetKey,
      reviewLetters,
    }),
  ];
}

export function createBubbleFloorLessons(
  config: Parameters<typeof createBubblePopChallengeLesson>[0],
): LessonContent[] {
  return [createBubblePopChallengeLesson(config)];
}

export function createDiacriticBuildFloorLessons(
  config: Parameters<typeof createDiacriticBuildChallengeLesson>[0],
): LessonContent[] {
  return [createDiacriticBuildChallengeLesson(config)];
}

export function createAnimalFeedFloorLessons(
  config: Parameters<typeof createAnimalFeedChallengeLesson>[0],
): LessonContent[] {
  return [createAnimalFeedChallengeLesson(config)];
}

export function createMemoryFlipFloorLessons(
  config: Parameters<typeof createMemoryFlipChallengeLesson>[0],
): LessonContent[] {
  return [createMemoryFlipChallengeLesson(config)];
}

// Backward-compatible aliases while page data modules are converging.
export const createPage1LetterFloorLessons = createLetterFloorLessons;
export const createPage2LetterFloorLessons = createLetterFloorLessons;

export const createPage1VocabularyFloorLessons = createVocabularyFloorLessons;
export const createPage2VocabularyFloorLessons = createVocabularyFloorLessons;

export const createPage1BubbleFloorLessons = createBubbleFloorLessons;
export const createPage2BubbleFloorLessons = createBubbleFloorLessons;

export const createPage1DiacriticBuildFloorLessons =
  createDiacriticBuildFloorLessons;

export const createPage1AnimalFeedFloorLessons = createAnimalFeedFloorLessons;

export const createPage1MemoryFlipFloorLessons = createMemoryFlipFloorLessons;
