import { LessonContent } from "../map-structure";
import { createBubblePopChallengeLesson } from "../../lesson-templates/challenges";
import { AUDIO } from "../../audio";

export const floor4Lessons: LessonContent[] = [
  createBubblePopChallengeLesson({
    lessonId: "t1-f4-bubble-pop",
    targetLetters: ["a", "c"],
    targetAudioByLetter: {
      a: AUDIO.GAME.BUBBLE_POP.TARGET_BY_LETTER.a,
      c: AUDIO.GAME.BUBBLE_POP.TARGET_BY_LETTER.c,
    },
  }),
];
