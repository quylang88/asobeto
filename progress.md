Original prompt: lesson 4 floor 3:
- loại bỏ dòng "bé tô theo mẫu từ ..."
- sử dụng tracing a.ts c.ts thêm tracing dấu sắc nữa ghép lại để thành tracing "cá". Chữ "c" sẽ ở trong ô 1,2 , "a" nằm trong ô 3,4 ; dấu sắc nằm trên chữ "a"
- chấm điểm vẫn giống với tracing của floor 1,2 (tối đa 2 sao)
-  nhu vậy floor 3 tối đa sẽ có 5 sao. chỉnh lại số sao max của floor 3

TODO
- [x] Remove trace helper sentence in active trace lesson UI.
- [x] Add composite tracing path for "cá" using strokes from c, a, and tone sắc.
- [x] Update floor-3 lesson-4 trace scoring thresholds to 2-star logic like floor 1/2.
- [x] Raise tower-1 floor-3 max stars to 5.
- [x] Make floor max stars dynamic in lesson completion/progress/floor cards.
- [x] Run validation checks.

Notes
- Tracing data is now organized by domain:
- `src/data/tracing/letters/*` for letter strokes (`a`, `c`)
- `src/data/tracing/words/*` for words (`ca`, `ca-sac`)
- Shared contracts moved to `src/data/tracing/types.ts`.
- Updated `ca.ts` layout to 5 columns so `a` occupies boxes 3-4-5 (while `c` stays in 1-2).
- Adjusted dấu sắc in `ca.ts`: moved left and shortened.
- Refactor follow-up:
- Removed `tones` folder as requested.
- Moved accent stroke into `words/ca-sac.ts`.
- Updated tracing map composition to use `letters + words`.
- `LetterTracingCanvas` now supports per-target grid layout via stroke animation metadata.
- Lesson 4 of tower-1/floor-3 now uses 2-star tracing thresholds (0.5/0.75) and `maxStars: 2`.
- Tower 1 floor 3 max stars is now `5`.
- Floor star aggregation/saving/completion rendering now uses dynamic `floorMaxStars` from selected floor instead of a hardcoded `3`.

---

Update (Floor 4 Bubble Challenge + image perf)

TODO
- [x] Separate floor 4 into its own mini-game data/config (no longer tied to floor 3 vocab template flow).
- [x] Add dedicated floor 4 game screen with level select, lock progression, rules audio, level briefing, countdown, and gameplay/result phases.
- [x] Implement bubble gameplay rules: target/wrong/empty bubbles, score/life/time rules, pass/fail conditions, and per-level difficulty settings.
- [x] Persist per-level stars (`easy|normal|hard`) and aggregate floor stars to max 6.
- [x] Optimize image loading for weak network (asset compression + Next image config + tuned quality/sizes in renderers).
- [x] Verify flow with lint and interactive smoke test.

Notes
- New lesson kind/type additions in map structure: `bubble_pop_challenge`, `bubblePopGame`.
- Floor 4 now uses one dedicated lesson (`t1-f4-bubble-pop`) with levels:
  - Easy: 35s, target 10, min 3 lives, reward 1 star.
  - Normal: 35s, target 14, min 2 lives, reward 2 stars.
  - Hard: 30s, target 18, min 2 lives, reward 3 stars.
- Difficulty tuning includes lane-based spawn and min vertical spacing to reduce mistaps.
- Spawn ratio tuning updated so wrong-letter bubbles still appear on easy:
  - easy: target 0.8, empty 0.1 (wrong 0.1)
  - normal: target 0.6, empty 0.12 (wrong 0.28)
  - hard: target 0.5, empty 0.1 (wrong 0.4)
- Added deterministic hooks on floor 4 screen:
  - `window.render_game_to_text()`
  - `window.advanceTime(ms)`
- Fixed type mismatch in floor 4 header mascot emotion (`focused` -> `excited`) so `tsc --noEmit` passes.
- Build still fails in restricted environment when fetching Google Fonts (`Mali`, `Varela Round`) from `fonts.googleapis.com`.

---

Update (Floor 4 polish pass)

TODO
- [x] Update target letter visuals to lowercase `a/c`, `font-hp-special`, and heavier weight for readability.
- [x] Trigger immediate pass flow: when enough score + lives, pause gameplay, show star celebration, then move to result.
- [x] Restyle bubbles to look more like balloons (gradient body, highlight, knot + string).
- [x] Shorten rules/instructions copy on select + in-game objective copy.
- [x] Redesign difficulty selection cards with gray locked states and unlock animation.
- [x] Re-verify with lint, typecheck, and interactive smoke checks.

Notes
- Floor-4 config text is now concise:
  - instruction/rules/rulesAudioText all centered on one sentence:
    `Bé hãy chạm vào bóng bay chữ cái theo yêu cầu.`
- In gameplay HUD and countdown, objective now reads:
  - `Hãy chạm vào bóng bay "a"` / `"c"` with `font-hp-special` styling.
- Added unlock celebration badge (`Mở khóa!`) when a new level becomes available after passing prerequisite level.
- Added pass celebration overlay with star burst, validated by runtime state:
  - `passCelebration: true` appears before switching to `mode: "result"`.
- Validation run:
  - `pnpm lint` pass.
  - `pnpm exec tsc --noEmit` pass.
  - Playwright smoke: confirmed locked/gray levels on fresh progress, unlock animation after passing Easy, and early pass transition with time still remaining.

---

Update (Floor 4 UX + pass/fail flow refinement)

TODO
- [x] Remove duplicated rule text on level-select intro.
- [x] Redesign level-select UI to feel more playful/kid-oriented while preserving lock/unlock states.
- [x] Fix pass condition bug where reaching target score did not pass due extra lives constraint.
- [x] Add pass celebration sequence: star pop + applause-cheering audio, then result screen title `Tuyệt Vời!`.
- [x] Add fail celebration sequence: opposite (grey/fall stars) + try-again audio, then result screen title `Cố lên bé nhé!`.
- [x] Make result flow return to level-select via single `Tiếp Tục` button.
- [x] Re-run lint/typecheck and interactive gameplay checks.

Notes
- Floor 4 now passes immediately on reaching target score (while still alive), instead of requiring `minLivesToPass`.
- Fail conditions now match requested behavior:
  - out of lives -> fail
  - time over without target score -> fail
- Integrated feedback audio files reused from lesson flow constants:
  - `/assets/audio/feedback/applause-cheering.mp3`
  - `/assets/audio/feedback/try-again.mp3`
- Added deterministic state flags in `render_game_to_text` for validation:
  - `passCelebration`
  - `failCelebration`
- Verified via Playwright:
  - no duplicated `Bé hãy chạm vào bóng bay chữ cái theo yêu cầu.` on select screen
  - pass sequence reaches `result` with `Tuyệt Vời!` and `Tiếp Tục` returns to select
  - fail sequence reaches `result` with `Cố lên bé nhé!`
  - pass still works after losing hearts before reaching target score

---

Update (Result screen parity + celebration polish)

TODO
- [x] Make floor-4 result screen full-screen (no top header) to match floor 1/2/3 completion experience.
- [x] Replace custom pass popup with existing active-lesson star-fly celebration (`StarCelebration` + `SuccessCelebrationOverlay`).
- [x] Replace fail popup with polished opposite celebration (broken-heart effect) before fail result.
- [x] Keep `Tiếp Tục` behavior: result -> back to level-select.
- [x] Revalidate pass/fail states with interactive checks.

Notes
- Floor-4 now short-circuits render when `phase === "result"` and returns a full-screen completion view (no header/progress bar).
- Pass celebration now reuses existing lesson components for consistent quality with active lessons.
- Added local `BrokenHeartCelebration` overlay for fail feedback with crack + shard motion.
- Playwright verification:
  - pass: `passCelebration=true`, title `Tuyệt Vời!`, `Tiếp Tục` available, no `Tổng sao` header text
  - fail: `failCelebration=true`, title `Cố lên bé nhé!`, no `Tổng sao` header text
