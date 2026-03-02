import { AnimatePresence, motion } from "framer-motion";
import { Hand } from "lucide-react";
import { useCallback } from "react";
import type { MutableRefObject, RefObject } from "react";
import type { DiacriticBuildLevelConfig } from "@/data/game-config";
import type {
  AxisBounds,
  ChallengePhase,
  FallingEntity,
  PlayfieldMetrics,
  TutorialCue,
  TutorialHandMotion,
} from "../types";
import { ToneSymbol } from "../tone-symbol";

interface CatcherFrameResolutionArgs {
  entities: FallingEntity[];
  deltaSeconds: number;
  escapedThreshold: number;
  isEntityCollidingWithCatcher: (entity: FallingEntity) => boolean;
}

interface CatcherFrameResolutionResult {
  nextEntities: FallingEntity[];
  capturedMarkers: FallingEntity[];
  collidedDebrisCount: number;
  missedMarkerCount: number;
}

interface CatcherTutorialSequenceArgs {
  laneCount: number;
  tutorialDurationMs: number;
  getLaneCenterX: (lane: number) => number;
  syncCatcherPosition: (centerX: number) => void;
  setTutorialCue: (cue: TutorialCue) => void;
  onDemoCapture: () => void;
  finishTutorial: (centerX: number) => void;
}

interface CatcherFooterProps {
  catcherRef: RefObject<HTMLDivElement | null>;
  slotRef: RefObject<HTMLDivElement | null>;
  catcherCenterX: number;
  toneTargetX: number;
  tutorialActive: boolean;
  isDraggingCatcher: boolean;
  displayLetter: string;
  letterPulseKey: number;
  showSlotPulse: boolean;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
}

interface CatcherHitboxInput {
  playfield: HTMLDivElement | null;
  catcher: HTMLDivElement | null;
  hitboxScale: number;
  catcherWidth: number;
  catcherCenterX: number;
  fallZoneHeight: number;
  playfieldHeight: number;
}

interface CatcherHitbox {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getCatcherHorizontalBounds({
  playfieldWidth,
  catcherWidth,
}: {
  playfieldWidth: number;
  catcherWidth: number;
}): AxisBounds {
  if (playfieldWidth <= 0 || catcherWidth <= 0) {
    return { min: playfieldWidth / 2, max: playfieldWidth / 2 };
  }
  // Allow dragging all the way to the frame edges so lane 0/last are reachable.
  return { min: 0, max: playfieldWidth };
}

function didEntityHitCatcherAcrossStep({
  entity,
  nextY,
  isEntityCollidingWithCatcher,
}: {
  entity: FallingEntity;
  nextY: number;
  isEntityCollidingWithCatcher: (entity: FallingEntity) => boolean;
}): boolean {
  const startEntity = entity;
  if (isEntityCollidingWithCatcher(startEntity)) return true;

  const endEntity = { ...entity, y: nextY };
  if (isEntityCollidingWithCatcher(endEntity)) return true;

  const distance = Math.abs(nextY - entity.y);
  if (distance < 1) return false;

  const sampleStep = Math.max(6, entity.size * 0.18);
  const sampleCount = Math.max(2, Math.ceil(distance / sampleStep));
  for (let index = 1; index < sampleCount; index += 1) {
    const t = index / sampleCount;
    const sampledEntity = {
      ...entity,
      y: entity.y + (nextY - entity.y) * t,
    };
    if (isEntityCollidingWithCatcher(sampledEntity)) {
      return true;
    }
  }

  return false;
}

export function resolveCatcherDragFrame({
  entities,
  deltaSeconds,
  escapedThreshold,
  isEntityCollidingWithCatcher,
}: CatcherFrameResolutionArgs): CatcherFrameResolutionResult {
  const nextEntities: FallingEntity[] = [];
  const capturedMarkers: FallingEntity[] = [];
  let collidedDebrisCount = 0;
  let missedMarkerCount = 0;

  for (const entity of entities) {
    const nextY = entity.y + entity.speed * deltaSeconds;
    const movedEntity = { ...entity, y: nextY };
    if (
      didEntityHitCatcherAcrossStep({
        entity,
        nextY,
        isEntityCollidingWithCatcher,
      })
    ) {
      if (movedEntity.kind === "marker") {
        capturedMarkers.push(movedEntity);
      } else {
        collidedDebrisCount += 1;
      }
      continue;
    }

    const escaped = nextY - entity.size / 2 > escapedThreshold;
    if (escaped) {
      if (entity.kind === "marker") {
        missedMarkerCount += 1;
      }
      continue;
    }
    nextEntities.push(movedEntity);
  }

  return {
    nextEntities,
    capturedMarkers,
    collidedDebrisCount,
    missedMarkerCount,
  };
}

export function getCatcherHitbox({
  playfield,
  catcher,
  hitboxScale,
  catcherWidth,
  catcherCenterX,
  fallZoneHeight,
  playfieldHeight,
}: CatcherHitboxInput): CatcherHitbox {
  const hitboxPaddingX = 8;
  const hitboxPaddingY = 6;
  if (playfield && catcher) {
    const playfieldRect = playfield.getBoundingClientRect();
    const catcherRect = catcher.getBoundingClientRect();
    const centerX =
      catcherRect.left - playfieldRect.left + catcherRect.width / 2;
    const centerY =
      catcherRect.top - playfieldRect.top + catcherRect.height / 2;
    const width = catcherRect.width * hitboxScale + hitboxPaddingX * 2;
    const height = catcherRect.height * hitboxScale + hitboxPaddingY * 2;
    return {
      left: centerX - width / 2,
      right: centerX + width / 2,
      top: centerY - height / 2,
      bottom: centerY + height / 2,
    };
  }

  const width = catcherWidth * hitboxScale + hitboxPaddingX * 2;
  const fallbackHeight = 78 * hitboxScale + hitboxPaddingY * 2;
  const centerY = fallZoneHeight + (playfieldHeight - fallZoneHeight) * 0.5;
  return {
    left: catcherCenterX - width / 2,
    right: catcherCenterX + width / 2,
    top: centerY - fallbackHeight / 2,
    bottom: centerY + fallbackHeight / 2,
  };
}

export function isEntityInCatcherHitbox({
  entity,
  hitbox,
  entityHitboxScale,
}: {
  entity: FallingEntity;
  hitbox: CatcherHitbox;
  entityHitboxScale: number;
}): boolean {
  const radius = (entity.size * entityHitboxScale) / 2;
  const nearestX = clampNumber(entity.x, hitbox.left, hitbox.right);
  const nearestY = clampNumber(entity.y, hitbox.top, hitbox.bottom);
  const dx = entity.x - nearestX;
  const dy = entity.y - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

export function startCatcherDragTutorialSequence({
  laneCount,
  tutorialDurationMs,
  getLaneCenterX,
  syncCatcherPosition,
  setTutorialCue,
  onDemoCapture,
  finishTutorial,
}: CatcherTutorialSequenceArgs): number[] {
  const centerLane = Math.floor(Math.max(1, laneCount) / 2);
  const startLane = Math.max(0, centerLane - 1);
  const startX = getLaneCenterX(startLane);
  const centerX = getLaneCenterX(centerLane);
  syncCatcherPosition(startX);

  const dragTimeout = window.setTimeout(() => {
    setTutorialCue("drag");
    syncCatcherPosition(centerX);
  }, 1300);
  const flyTimeout = window.setTimeout(() => {
    setTutorialCue("fly");
  }, 2050);
  const morphTimeout = window.setTimeout(() => {
    onDemoCapture();
  }, 2550);
  const endTimeout = window.setTimeout(() => {
    finishTutorial(centerX);
  }, tutorialDurationMs);

  return [dragTimeout, flyTimeout, morphTimeout, endTimeout];
}

export function getCatcherDragTutorialHandMotion({
  playfieldMetrics,
  laneCount,
  tutorialCue,
}: {
  playfieldMetrics: PlayfieldMetrics;
  laneCount: number;
  tutorialCue: TutorialCue;
}): TutorialHandMotion {
  const safeLaneCount = Math.max(1, laneCount);
  const laneWidth = playfieldMetrics.width / safeLaneCount;
  const centerLane = Math.floor(safeLaneCount / 2);
  const startLane = Math.max(0, centerLane - 1);
  const startX = laneWidth * startLane + laneWidth / 2 - 18;
  const endX = laneWidth * centerLane + laneWidth / 2 - 18;
  const handY =
    playfieldMetrics.fallZoneHeight +
    (playfieldMetrics.height - playfieldMetrics.fallZoneHeight) * 0.42;

  if (tutorialCue === "drag") {
    return {
      x: [startX, endX],
      y: [handY, handY],
    };
  }

  return {
    x: endX,
    y: handY,
  };
}

export function CatcherDragFallingEntity({
  entity,
  hitboxScale,
}: {
  entity: FallingEntity;
  hitboxScale: number;
}) {
  const hitboxSize = entity.size * hitboxScale;
  const isMarker = entity.kind === "marker";

  return (
    <div
      className="pointer-events-none absolute flex items-center justify-center"
      style={{
        width: hitboxSize,
        height: hitboxSize,
        left: entity.x - hitboxSize / 2,
        top: entity.y - hitboxSize / 2,
      }}
      aria-hidden="true"
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
    </div>
  );
}

export function CatcherDragTutorialHand({
  cue,
  handMotion,
}: {
  cue: TutorialCue;
  handMotion: TutorialHandMotion;
}) {
  return (
    <AnimatePresence>
      {cue === "drag" && (
        <motion.div
          key="tutorial-hand-drag"
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
            scale: [1, 0.92, 1],
          }}
          exit={{ opacity: 0, scale: 0.75 }}
          transition={{
            duration: 1.05,
            repeat: 0,
            ease: "easeInOut",
          }}
          className="absolute rounded-full bg-white/95 p-2 text-cyan-700 shadow-lg"
        >
          <Hand className="h-6 w-6" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CatcherDragFooter({
  catcherRef,
  slotRef,
  catcherCenterX,
  toneTargetX,
  tutorialActive,
  isDraggingCatcher,
  displayLetter,
  letterPulseKey,
  showSlotPulse,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: CatcherFooterProps) {
  return (
    <>
      <div
        ref={slotRef}
        className="pointer-events-none absolute top-4 h-1 w-1 opacity-0"
        style={{
          left: toneTargetX,
          transform: "translateX(-50%)",
        }}
      />
      <motion.div
        ref={catcherRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`absolute bottom-3 rounded-2xl px-2 pb-1 pt-0.5 ${
          tutorialActive ? "pointer-events-none" : "touch-none"
        }`}
        style={{
          left: catcherCenterX,
          transform: "translateX(-50%)",
        }}
        animate={isDraggingCatcher ? { scale: 1.04 } : { scale: 1 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
      >
        <motion.span
          key={`${displayLetter}-${letterPulseKey}`}
          initial={{ scale: 0.92 }}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 0.34, ease: "easeOut" }}
          className={`font-hp-special text-[4.5rem] font-black leading-none text-emerald-700 drop-shadow-[0_0_10px_rgba(16,185,129,0.32)] ${
            showSlotPulse
              ? "drop-shadow-[0_0_14px_rgba(16,185,129,0.6)]"
              : ""
          }`}
        >
          {displayLetter}
        </motion.span>
      </motion.div>
    </>
  );
}

export function useCatcherDragPointerHandlers({
  phase,
  tutorialActiveRef,
  activePointerIdRef,
  setIsDraggingCatcher,
  updateCatcherByClientX,
  releaseCatcherDrag,
}: {
  phase: ChallengePhase;
  tutorialActiveRef: MutableRefObject<boolean>;
  activePointerIdRef: MutableRefObject<number | null>;
  setIsDraggingCatcher: (dragging: boolean) => void;
  updateCatcherByClientX: (clientX: number) => void;
  releaseCatcherDrag: () => void;
}) {
  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (phase !== "playing") return;
      if (tutorialActiveRef.current) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      activePointerIdRef.current = event.pointerId;
      setIsDraggingCatcher(true);
      updateCatcherByClientX(event.clientX);
    },
    [
      activePointerIdRef,
      phase,
      setIsDraggingCatcher,
      tutorialActiveRef,
      updateCatcherByClientX,
    ],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return;
      updateCatcherByClientX(event.clientX);
    },
    [activePointerIdRef, updateCatcherByClientX],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (activePointerIdRef.current !== event.pointerId) return;
      releaseCatcherDrag();
    },
    [activePointerIdRef, releaseCatcherDrag],
  );

  return { onPointerDown, onPointerMove, onPointerUp };
}

export function createCatcherTutorialFinish({
  tutorialActiveRef,
  setTutorialActive,
  setTutorialCue,
  setShowSlotPulse,
  setShowSparkleBurst,
  setProgressCount,
  progressRef,
  setDisplayLetter,
  baseLetter,
  syncCatcherPosition,
  beginLiveRound,
  level,
}: {
  tutorialActiveRef: MutableRefObject<boolean>;
  setTutorialActive: (active: boolean) => void;
  setTutorialCue: (cue: TutorialCue) => void;
  setShowSlotPulse: (show: boolean) => void;
  setShowSparkleBurst: (show: boolean) => void;
  setProgressCount: (value: number) => void;
  progressRef: MutableRefObject<number>;
  setDisplayLetter: (value: string) => void;
  baseLetter: string;
  syncCatcherPosition: (centerX: number) => void;
  beginLiveRound: (level: DiacriticBuildLevelConfig) => void;
  level: DiacriticBuildLevelConfig;
}) {
  return (centerX: number) => {
    tutorialActiveRef.current = false;
    setTutorialActive(false);
    setTutorialCue("drop");
    setShowSlotPulse(false);
    setShowSparkleBurst(false);
    setProgressCount(0);
    progressRef.current = 0;
    setDisplayLetter(baseLetter);
    syncCatcherPosition(centerX);
    beginLiveRound(level);
  };
}
