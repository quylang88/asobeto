export const FEEDBACK_ADVANCE_DELAY_MS = 2600;
export const TRACE_STARS_ADVANCE_DELAY_MS = 3800;
export const FEEDBACK_SUCCESS_AUDIO = "/assets/audio/feedback/success-answer.mp3";
export const FEEDBACK_WRONG_AUDIO = "/assets/audio/feedback/wrong-answer.mp3";
export const FEEDBACK_FLOOR_CHEER_AUDIO = "/assets/audio/feedback/applause-cheering.mp3";
export const FEEDBACK_FLOOR_TRY_AGAIN_AUDIO = "/assets/audio/feedback/try-again.mp3";
export const CONFETTI_COLORS = ["#22c55e", "#f59e0b", "#38bdf8", "#fb7185", "#f97316"];
export const FOG_ERASE_RADIUS = 24;
export const LESSON_PREVIEW_CONTROL_OFFSET_CLASS = "-right-14";
export const FLOOR_MAX_STARS = 3;
export const WORD_BUILD_TILE_SIZE_PX = 80;
export const LETTER_TOP_INSTRUCTION_KINDS = new Set([
  "letter_listen",
  "letter_quiz",
  "letter_trace_demo",
  "letter_trace_practice",
]);

export const CONFETTI_PIECES = Array.from({ length: 26 }, (_, index) => ({
  id: index,
  left: (index * 17) % 100,
  delay: (index % 7) * 0.07,
  duration: 1.2 + (index % 5) * 0.28,
  xDrift: (index % 2 === 0 ? 1 : -1) * (10 + (index % 4) * 8),
  rotate: (index * 43) % 360,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
}));
