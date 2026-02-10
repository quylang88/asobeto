// Điểm vào tập trung cho module Lesson Interface: giữ import gọn và dễ mở rộng lesson mới.
export {
  FEEDBACK_ADVANCE_DELAY_MS,
  FLOOR_MAX_STARS,
  TRACE_STARS_ADVANCE_DELAY_MS,
} from "./constants";
export * from "./components";
export {
  isFloor3ListenLookLessonKind,
  isFogRevealLessonKind,
  isLetterGridPreviewLessonKind,
  isLetterTraceDemoLessonKind,
  isLetterTracePracticeLessonKind,
  isTracePracticeLessonKind,
  isVocabListenRepeatLessonKind,
  isVocabTracePracticeLessonKind,
  isWordBuildLessonKind,
  shouldPromoteTitleToInstructionKind,
  shouldUseLargerVocabImageKind,
} from "./lesson-kind-guards";
export * from "./hooks";
export * from "./renderers";
export type {
  WordBuildActiveDrag,
  WordBuildSlotPlacement,
  WordBuildToken,
} from "./types";
export {
  getAttemptFloorStars,
  getLessonMaxStars,
  getTracePracticeLessonIdFromDemoLessonId,
  getWordBuildSlotPlacements,
  getWordBuildStateForLesson,
  getWordBuildTokenDisplayText,
} from "./utils";
