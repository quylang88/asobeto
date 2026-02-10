import type { BubblePassStarRule, BubblePopLevelId } from "./map-structure";

export const BUBBLE_PASS_STAR_RULES_BY_LEVEL: Record<
  Exclude<BubblePopLevelId, "easy">,
  BubblePassStarRule[]
> = {
  normal: [
    {
      stars: 2,
      maxLivesLost: 0,
    },
    {
      stars: 1,
      minLivesLost: 1,
    },
  ],
  hard: [
    {
      stars: 3,
      maxLivesLost: 0,
      minTimeLeftExclusive: 9,
    },
    {
      stars: 2,
      maxLivesLost: 0,
      maxTimeLeftInclusive: 9,
    },
    {
      stars: 1,
      minLivesLost: 1,
    },
  ],
};
