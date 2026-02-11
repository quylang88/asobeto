"use client";

import {
  type Dispatch,
  type PointerEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { WORD_BUILD_TILE_SIZE_PX } from "../constants";
import type { WordBuildActiveDrag } from "../types";

interface UseWordBuildDragParams {
  isWordBuildLesson: boolean;
  isCorrect: boolean | null;
  wordBuildSourceTokenIds: string[];
  setWordBuildSlotTokenIds: Dispatch<SetStateAction<Array<string | null>>>;
}

export function useWordBuildDrag({
  isWordBuildLesson,
  isCorrect,
  wordBuildSourceTokenIds,
  setWordBuildSlotTokenIds,
}: UseWordBuildDragParams) {
  const [wordBuildActiveDrag, setWordBuildActiveDrag] =
    useState<WordBuildActiveDrag | null>(null);

  const wordBuildDragPointerIdRef = useRef<number | null>(null);
  const wordBuildDragPositionRef = useRef({ clientX: 0, clientY: 0 });
  const wordBuildDragPointerOffsetRef = useRef({
    x: WORD_BUILD_TILE_SIZE_PX / 2,
    y: WORD_BUILD_TILE_SIZE_PX / 2,
  });
  const wordBuildDragFrameRef = useRef<number | null>(null);
  const wordBuildGhostRef = useRef<HTMLDivElement | null>(null);
  const wordBuildDragCaptureTargetRef = useRef<HTMLElement | null>(null);
  const previousBodyTouchActionRef = useRef<string | null>(null);

  const syncWordBuildGhostPosition = useCallback(() => {
    wordBuildDragFrameRef.current = null;
    const ghost = wordBuildGhostRef.current;
    if (!ghost) return;

    const { clientX, clientY } = wordBuildDragPositionRef.current;
    const { x: pointerOffsetX, y: pointerOffsetY } =
      wordBuildDragPointerOffsetRef.current;
    const ghostX = Math.round(clientX - pointerOffsetX);
    const ghostY = Math.round(clientY - pointerOffsetY);
    ghost.style.transform = `translate3d(${ghostX}px, ${ghostY}px, 0)`;
  }, []);

  const lockBodyTouchActionForDrag = useCallback(() => {
    if (typeof document === "undefined") return;
    if (previousBodyTouchActionRef.current !== null) return;
    previousBodyTouchActionRef.current = document.body.style.touchAction;
    document.body.style.touchAction = "none";
  }, []);

  const restoreBodyTouchActionAfterDrag = useCallback(() => {
    if (typeof document === "undefined") return;
    if (previousBodyTouchActionRef.current === null) return;
    document.body.style.touchAction = previousBodyTouchActionRef.current;
    previousBodyTouchActionRef.current = null;
  }, []);

  const scheduleWordBuildGhostPositionSync = useCallback(() => {
    if (wordBuildDragFrameRef.current !== null) return;
    wordBuildDragFrameRef.current = window.requestAnimationFrame(
      syncWordBuildGhostPosition,
    );
  }, [syncWordBuildGhostPosition]);

  const resetWordBuildDragState = useCallback(() => {
    const pointerId = wordBuildDragPointerIdRef.current;
    const captureTarget = wordBuildDragCaptureTargetRef.current;
    if (captureTarget && pointerId !== null) {
      try {
        if (captureTarget.hasPointerCapture(pointerId)) {
          captureTarget.releasePointerCapture(pointerId);
        }
      } catch {
        // Ignore release errors on browsers without stable pointer capture support.
      }
    }

    wordBuildDragCaptureTargetRef.current = null;
    wordBuildDragPointerIdRef.current = null;
    wordBuildDragPointerOffsetRef.current = {
      x: WORD_BUILD_TILE_SIZE_PX / 2,
      y: WORD_BUILD_TILE_SIZE_PX / 2,
    };
    if (wordBuildDragFrameRef.current !== null) {
      window.cancelAnimationFrame(wordBuildDragFrameRef.current);
      wordBuildDragFrameRef.current = null;
    }
    restoreBodyTouchActionAfterDrag();
    setWordBuildActiveDrag(null);
  }, [restoreBodyTouchActionAfterDrag]);

  const getWordBuildSlotIndexFromPoint = useCallback(
    (clientX: number, clientY: number): number | null => {
      const targetElement = document.elementFromPoint(clientX, clientY);
      if (!(targetElement instanceof HTMLElement)) return null;

      const slotElement = targetElement.closest<HTMLElement>(
        "[data-word-build-slot-index]",
      );
      if (!slotElement) return null;

      const rawSlotIndex = slotElement.dataset.wordBuildSlotIndex;
      if (!rawSlotIndex) return null;

      const slotIndex = Number.parseInt(rawSlotIndex, 10);
      if (!Number.isInteger(slotIndex)) return null;
      return slotIndex;
    },
    [],
  );

  const handleWordBuildTokenPointerDown = useCallback(
    (
      event: PointerEvent<HTMLElement>,
      tokenId: string,
      sourceSlotIndex: number | null,
    ) => {
      if (!isWordBuildLesson || isCorrect !== null || wordBuildActiveDrag) return;
      if (event.pointerType !== "touch" && event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();

      wordBuildDragPointerIdRef.current = event.pointerId;
      wordBuildDragPositionRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
      const pointerTarget = event.currentTarget;
      if (pointerTarget instanceof HTMLElement) {
        const targetRect = pointerTarget.getBoundingClientRect();
        wordBuildDragPointerOffsetRef.current = {
          x: Math.min(
            Math.max(event.clientX - targetRect.left, 0),
            targetRect.width || WORD_BUILD_TILE_SIZE_PX,
          ),
          y: Math.min(
            Math.max(event.clientY - targetRect.top, 0),
            targetRect.height || WORD_BUILD_TILE_SIZE_PX,
          ),
        };
        try {
          pointerTarget.setPointerCapture(event.pointerId);
          wordBuildDragCaptureTargetRef.current = pointerTarget;
        } catch {
          wordBuildDragCaptureTargetRef.current = null;
        }
      }
      lockBodyTouchActionForDrag();
      setWordBuildActiveDrag({ tokenId, sourceSlotIndex });
      scheduleWordBuildGhostPositionSync();
    },
    [
      isCorrect,
      isWordBuildLesson,
      lockBodyTouchActionForDrag,
      scheduleWordBuildGhostPositionSync,
      wordBuildActiveDrag,
    ],
  );

  useEffect(() => {
    if (!wordBuildActiveDrag) return;

    const allowedSourceTokenIds = new Set(wordBuildSourceTokenIds);
    scheduleWordBuildGhostPositionSync();

    const handleWindowPointerMove = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== wordBuildDragPointerIdRef.current) return;

      wordBuildDragPositionRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
      scheduleWordBuildGhostPositionSync();
      event.preventDefault();
    };

    const handleWindowPointerEnd = (event: globalThis.PointerEvent) => {
      if (event.pointerId !== wordBuildDragPointerIdRef.current) return;

      const dropSlotIndex = getWordBuildSlotIndexFromPoint(
        event.clientX,
        event.clientY,
      );
      const draggedTokenId = wordBuildActiveDrag.tokenId;
      if (
        dropSlotIndex !== null &&
        isWordBuildLesson &&
        isCorrect === null &&
        allowedSourceTokenIds.has(draggedTokenId)
      ) {
        setWordBuildSlotTokenIds((previousSlots) => {
          if (dropSlotIndex < 0 || dropSlotIndex >= previousSlots.length) {
            return previousSlots;
          }

          const nextSlots = [...previousSlots];
          const sourceSlotIndex = nextSlots.findIndex(
            (placedTokenId) => placedTokenId === draggedTokenId,
          );
          if (sourceSlotIndex === dropSlotIndex) {
            return previousSlots;
          }

          const displacedTokenId = nextSlots[dropSlotIndex];
          if (sourceSlotIndex >= 0) {
            nextSlots[sourceSlotIndex] = displacedTokenId ?? null;
          }

          nextSlots[dropSlotIndex] = draggedTokenId;
          return nextSlots;
        });
      }

      resetWordBuildDragState();
      event.preventDefault();
    };

    window.addEventListener("pointermove", handleWindowPointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", handleWindowPointerEnd, {
      passive: false,
    });
    window.addEventListener("pointercancel", handleWindowPointerEnd, {
      passive: false,
    });

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerEnd);
      window.removeEventListener("pointercancel", handleWindowPointerEnd);
    };
  }, [
    getWordBuildSlotIndexFromPoint,
    isCorrect,
    isWordBuildLesson,
    resetWordBuildDragState,
    scheduleWordBuildGhostPositionSync,
    setWordBuildSlotTokenIds,
    wordBuildActiveDrag,
    wordBuildSourceTokenIds,
  ]);

  useEffect(() => {
    return () => {
      const pointerId = wordBuildDragPointerIdRef.current;
      const captureTarget = wordBuildDragCaptureTargetRef.current;
      if (captureTarget && pointerId !== null) {
        try {
          if (captureTarget.hasPointerCapture(pointerId)) {
            captureTarget.releasePointerCapture(pointerId);
          }
        } catch {
          // Ignore release errors on cleanup.
        }
      }
      wordBuildDragCaptureTargetRef.current = null;
      wordBuildDragPointerIdRef.current = null;
      wordBuildDragPointerOffsetRef.current = {
        x: WORD_BUILD_TILE_SIZE_PX / 2,
        y: WORD_BUILD_TILE_SIZE_PX / 2,
      };
      if (wordBuildDragFrameRef.current !== null) {
        window.cancelAnimationFrame(wordBuildDragFrameRef.current);
        wordBuildDragFrameRef.current = null;
      }
      restoreBodyTouchActionAfterDrag();
    };
  }, [restoreBodyTouchActionAfterDrag]);

  return {
    wordBuildActiveDrag,
    wordBuildGhostRef,
    handleWordBuildTokenPointerDown,
    resetWordBuildDragState,
  };
}
