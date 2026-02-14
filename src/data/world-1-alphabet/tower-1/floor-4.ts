import { LessonContent } from "../map-structure";
import { createBubblePopChallengeLesson } from "../../lesson-templates/challenges";

export const floor4Lessons: LessonContent[] = [
  createBubblePopChallengeLesson({
    lessonId: "t1-f4-bubble-pop",
    targetLetters: ["a", "c"],
    targetAudioByLetter: {
      a: "/assets/audio/game/bubble-pop/target-a.mp3",
      c: "/assets/audio/game/bubble-pop/target-c.mp3",
    },
  }),
];
