import { LessonContent } from "../map-structure";
import { createBubblePopChallengeLessons } from "../lesson-templates";

export const floor4Lessons: LessonContent[] = createBubblePopChallengeLessons({
  lessonPrefix: "t1-f4",
  targetLetters: ["a", "c"],
  targetAudioByLetter: {
    a: "/assets/audio/game/bubble-pop/target-a.mp3",
    c: "/assets/audio/game/bubble-pop/target-c.mp3",
  },
});
