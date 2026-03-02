import { motion } from "framer-motion";
import { Hand } from "lucide-react";
import type { MutableRefObject, RefObject } from "react";
import type { DiacriticBuildLevelConfig } from "@/data/game-config";
import type {
  ChallengePhase,
  FallingEntity,
  PlayfieldMetrics,
  TutorialHandMotion,
  TutorialCue,
} from "../types";
import { ToneSymbol } from "../tone-symbol";

interface TapFrameResolutionArgs {
  entities: FallingEntity[];
  deltaSeconds: number;
  escapedThreshold: number;
}

interface TapFrameResolutionResult {
  nextEntities: FallingEntity[];
  missedMarkerCount: number;
}

interface TapTutorialSequenceArgs {
  level: DiacriticBuildLevelConfig;
  tutorialDurationMs: number;
  setTutorialCue: (cue: TutorialCue) => void;
  triggerCaptureFeedback: (level: DiacriticBuildLevelConfig) => void;
  finishTutorial: () => void;
}

interface TapFallingEntityProps {
  entity: FallingEntity;
  hitboxScale: number;
  onTap: (entityId: number) => void;
}

interface TapFooterProps {
  slotRef: RefObject<HTMLDivElement | null>;
  displayLetter: string;
  letterPulseKey: number;
  showSlotPulse: boolean;
}

interface HandleTapEntityInteractionArgs {
  entityId: number;
  phase: ChallengePhase;
  tutorialActive: boolean;
  running: boolean;
  entitiesRef: MutableRefObject<FallingEntity[]>;
  onEntitiesChange: (entities: FallingEntity[]) => void;
  onMarkerTap: (entity: FallingEntity) => void;
  onDebrisTap: () => void;
}

export function resolveTapFrame({
  entities,
  deltaSeconds,
  escapedThreshold,
}: TapFrameResolutionArgs): TapFrameResolutionResult {
  const nextEntities: FallingEntity[] = [];
  let missedMarkerCount = 0;

  for (const entity of entities) {
    const nextY = entity.y + entity.speed * deltaSeconds;
    const escaped = nextY - entity.size / 2 > escapedThreshold;
    if (escaped) {
      if (entity.kind === "marker") {
        missedMarkerCount += 1;
      }
      continue;
    }
    nextEntities.push({ ...entity, y: nextY });
  }

  return { nextEntities, missedMarkerCount };
}

export function startTapTutorialSequence({
  level,
  tutorialDurationMs,
  setTutorialCue,
  triggerCaptureFeedback,
  finishTutorial,
}: TapTutorialSequenceArgs): number[] {
  const tapTimeout = window.setTimeout(() => {
    setTutorialCue("tap");
  }, 1200);
  const flyTimeout = window.setTimeout(() => {
    setTutorialCue("fly");
  }, 1800);
  const morphTimeout = window.setTimeout(() => {
    triggerCaptureFeedback(level);
  }, 2200);
  const endTimeout = window.setTimeout(() => {
    finishTutorial();
  }, tutorialDurationMs);

  return [tapTimeout, flyTimeout, morphTimeout, endTimeout];
}

export function getTapTutorialHandMotion(
  playfieldMetrics: PlayfieldMetrics,
): TutorialHandMotion {
  return {
    x: playfieldMetrics.width / 2 - 18,
    y: playfieldMetrics.fallZoneHeight * 0.35,
  };
}

export function TapFallingEntity({
  entity,
  hitboxScale,
  onTap,
}: TapFallingEntityProps) {
  const hitboxSize = entity.size * hitboxScale;
  const isMarker = entity.kind === "marker";

  return (
    <button
      onClick={() => onTap(entity.id)}
      className="absolute flex items-center justify-center rounded-full active:scale-95"
      style={{
        width: hitboxSize,
        height: hitboxSize,
        left: entity.x - hitboxSize / 2,
        top: entity.y - hitboxSize / 2,
      }}
      aria-label={
        isMarker ? `Dấu đúng ${entity.symbol}` : `Vật cản ${entity.symbol}`
      }
    >
      <span
        className={`relative flex items-center justify-center rounded-full border-2 shadow-md ${
          isMarker
            ? "border-emerald-500 bg-linear-to-b from-emerald-100 via-emerald-200 to-emerald-400 text-emerald-900"
            : "border-orange-500 bg-linear-to-b from-orange-100 via-orange-200 to-orange-400 text-orange-900"
        }`}
        style={{
          width: entity.size,
          height: entity.size,
        }}
      >
        <span className="pointer-events-none absolute left-[28%] top-[20%] h-[20%] w-[28%] rounded-full bg-white/70 blur-[0.3px]" />
        <ToneSymbol
          symbol={entity.symbol}
          className="font-black leading-none text-[2.2rem]"
        />
      </span>
    </button>
  );
}

export function TapTutorialHand({
  cue,
  handMotion,
}: {
  cue: TutorialCue;
  handMotion: TutorialHandMotion;
}) {
  if (cue !== "tap") return null;

  return (
    <motion.div
      key="tutorial-hand-tap"
      initial={{
        opacity: 0,
        scale: 0.75,
        x: Array.isArray(handMotion.x) ? handMotion.x[0] : handMotion.x,
        y: Array.isArray(handMotion.y) ? handMotion.y[0] : handMotion.y,
      }}
      animate={{
        opacity: 1,
        x: handMotion.x,
        y: handMotion.y,
        scale: [1, 0.88, 1],
      }}
      exit={{ opacity: 0, scale: 0.75 }}
      transition={{
        duration: 0.7,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="absolute rounded-full bg-white/95 p-2 text-cyan-700 shadow-lg"
    >
      <Hand className="h-6 w-6" />
    </motion.div>
  );
}

export function TapFooter({
  slotRef,
  displayLetter,
  letterPulseKey,
  showSlotPulse,
}: TapFooterProps) {
  return (
    <>
      <div
        ref={slotRef}
        className="pointer-events-none absolute left-1/2 top-5 h-1 w-1 -translate-x-1/2 opacity-0"
      />
      <motion.span
        key={`${displayLetter}-${letterPulseKey}`}
        initial={{ scale: 0.92 }}
        animate={{ scale: [1, 1.14, 1] }}
        transition={{ duration: 0.34, ease: "easeOut" }}
        className={`font-hp-special text-[4.5rem] font-black leading-none text-emerald-700 ${
          showSlotPulse ? "drop-shadow-[0_0_12px_rgba(16,185,129,0.55)]" : ""
        }`}
      >
        {displayLetter}
      </motion.span>
    </>
  );
}

export function handleTapEntityInteraction({
  entityId,
  phase,
  tutorialActive,
  running,
  entitiesRef,
  onEntitiesChange,
  onMarkerTap,
  onDebrisTap,
}: HandleTapEntityInteractionArgs): void {
  if (phase !== "playing") return;
  if (tutorialActive) return;
  if (!running) return;

  const entityIndex = entitiesRef.current.findIndex(
    (entity) => entity.id === entityId,
  );
  if (entityIndex < 0) return;

  const [entity] = entitiesRef.current.splice(entityIndex, 1);
  if (!entity) return;

  onEntitiesChange([...entitiesRef.current]);

  if (entity.kind === "marker") {
    onMarkerTap(entity);
    return;
  }

  onDebrisTap();
}

export function createTapTutorialFinish({
  tutorialActiveRef,
  setTutorialActive,
  setTutorialCue,
  setShowSlotPulse,
  setShowSparkleBurst,
  setDisplayLetter,
  baseLetter,
  beginLiveRound,
  level,
}: {
  tutorialActiveRef: MutableRefObject<boolean>;
  setTutorialActive: (active: boolean) => void;
  setTutorialCue: (cue: TutorialCue) => void;
  setShowSlotPulse: (show: boolean) => void;
  setShowSparkleBurst: (show: boolean) => void;
  setDisplayLetter: (value: string) => void;
  baseLetter: string;
  beginLiveRound: (level: DiacriticBuildLevelConfig) => void;
  level: DiacriticBuildLevelConfig;
}) {
  return () => {
    tutorialActiveRef.current = false;
    setTutorialActive(false);
    setTutorialCue("drop");
    setShowSlotPulse(false);
    setShowSparkleBurst(false);
    setDisplayLetter(baseLetter);
    beginLiveRound(level);
  };
}
