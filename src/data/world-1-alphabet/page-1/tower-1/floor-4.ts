import type { LessonContent } from "../../types";
import { AUDIO } from "../../../audio";
import { createPage1BubbleFloorLessons } from "../../page-helpers";

export const floor4Lessons: LessonContent[] = createPage1BubbleFloorLessons({
  lessonId: "t1-f4-bubble-pop",
  targetLetters: ["a", "c"],
  targetAudioByLetter: {
    a: AUDIO.GAME.BUBBLE_POP.TARGET_BY_LETTER.a,
    c: AUDIO.GAME.BUBBLE_POP.TARGET_BY_LETTER.c,
  },
});
