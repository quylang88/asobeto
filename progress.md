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

---

Update (Migrate PNG -> WebP + fix floor4 title header overlap)

TODO
- [x] Replace remaining `.png` image references with `.webp` across app metadata + lesson templates.
- [x] Remove old png icon/image files no longer used.
- [x] Update manifest/icon MIME types from `image/png` to `image/webp`.
- [x] Fix floor4 mini game top title header being obscured in narrow/mobile layout.
- [x] Re-run lint/typecheck + quick UI smoke check.

Notes
- Updated app icons in metadata + manifest to `fish.webp` with `image/webp`.
- Updated vocab lesson image paths to `.webp` variants (`mainImage` and tracing guide path).
- Removed obsolete png files:
  - `public/assets/images/fish.png`
  - `public/assets/images/fish-with-word.png`
  - `public/asobeto-icon.png`
- Floor4 header now uses safe-area top padding and stronger flex constraints so title does not get clipped by notch/mascot.
- Validation:
  - `pnpm lint` pass
  - `pnpm exec tsc --noEmit` pass
  - Manual Playwright smoke: floor4 header visible with back button + title + mascot.

---

Update (Remove review mode + move tower 2-5 floor4 to bubble minigame)

TODO
- [x] Remove `reviewMode` from vocab lesson template config and generation logic.
- [x] Convert `tower-2..5/floor-4` from vocab review lessons to `bubble_pop_challenge`.
- [x] Keep floor-4 card metadata aligned with minigame (`nameUnlocked`, `descriptionUnlocked`, `maxStars`).
- [x] Make floor-4 bubble challenge support arbitrary `targetLetters` (not hardcoded `a/c`).
- [x] Re-run lint + typecheck and smoke test one converted tower flow.

Notes
- `createVocabFloorLessons` no longer has any `reviewMode` branch; floor-3 remains standard vocab lesson template usage.
- Converted floor-4 minigame configs:
  - tower 2 target letters: `ă`, `n`
  - tower 3 target letters: `e`, `m`
  - tower 4 target letters: `o`, `b`
  - tower 5 target letters: `ô`, `b`
- Updated floor card labels for tower 2-5 floor-4 to match tower-1 style:
  - `nameUnlocked: "Bóng bay chữ"`
  - `descriptionUnlocked: "Mini game"`
  - `maxStars: 6`
- `Floor4BubbleChallenge` now normalizes and uses dynamic `targetLetters` from config for both target/wrong bubble generation.

Validation
- `pnpm lint` pass
- `pnpm exec tsc --noEmit` pass
- Playwright smoke (tower 2 floor 4): `render_game_to_text` shows `targetLetter: "ă"` and spawned bubbles include both `ă` and `n`.
- `node $WEB_GAME_CLIENT ...` could not run in this env because package `playwright` is missing for that script import path.

---

Update (Audio path migration + remove speed variants + bubble mp3 narration)

TODO
- [x] Remove `slow/normal/fast` variant model and UI buttons in passive preview lessons.
- [x] Switch letter audio path from `*-normal.mp3` to single-file format (`a.mp3`, `c.mp3`, ...).
- [x] Switch intro path format for floor 1/2/3 lessons to folder-based paths under `intro-letters/*` and `intro-words/*`.
- [x] Use the new spelling file path for word `cá` (`intro-words/fish/spelling.mp3`) in listen-repeat.
- [x] Remove bubble game `speechSynthesis` usage and replace with mp3 playback from `assets/audio/game/bubble-pop` (`intro`, `rules`, `target-*`).

Notes
- `LessonAudioVariant`, `AudioPlaybackSpeed`, and `requiredPlaybackSpeeds` were removed from world-1 map structure.
- Passive preview renderer no longer renders speed buttons (`Chậm/Thường/Nhanh`); replay uses one default lesson audio.
- Letter lesson templates now use:
  - intro: `/assets/audio/intro-letters/<assetKey>/intro-{1..4}.mp3`
  - main audio: `/assets/audio/letters/<assetKey>.mp3`
- Vocabulary templates now use:
  - intro: `/assets/audio/intro-words/<assetKey>/intro-{1..4}.mp3`
  - spelling (listen-repeat): `/assets/audio/intro-words/<assetKey>/spelling.mp3`
- Floor-4 bubble config now has mp3 fields (`introAudio`, `rulesAudio`, `targetAudioByLetter`) and the screen plays:
  - first open select: intro -> rules
  - replay button: rules
  - start countdown: target-letter audio

Validation
- `pnpm lint` pass
- `pnpm exec tsc --noEmit` pass
- Asset existence spot-check pass for updated paths:
  - `public/assets/audio/letters/a.mp3`, `public/assets/audio/letters/c.mp3`
  - `public/assets/audio/intro-letters/a/intro-1.mp3`, `public/assets/audio/intro-letters/c/intro-1.mp3`
  - `public/assets/audio/intro-words/fish/intro-1.mp3`, `public/assets/audio/intro-words/fish/spelling.mp3`
  - `public/assets/audio/game/bubble-pop/intro.mp3`, `rules.mp3`, `target-a.mp3`, `target-c.mp3`
- Manual Playwright smoke on running dev app (`http://127.0.0.1:3100`):
  - Entered tower-1 floor-4 bubble game and opened level-select screen.
  - Verified network requests for narration audio:
    - select phase: `/assets/audio/game/bubble-pop/intro.mp3` and `rules.mp3` (HTTP 206)
    - countdown phase after starting level: `/assets/audio/game/bubble-pop/target-c.mp3` (HTTP 206)
- `node $WEB_GAME_CLIENT ...` still cannot run in this env because package `playwright` is not installed for that client script.

---

Update (Follow-up UX/audio fixes from review)

TODO
- [x] Change floor-4 select auto narration to play intro only (do not auto-play rules).
- [x] Keep `Nghe Luật` button mapped to `rules.mp3`.
- [x] Rename all continue CTAs from `Tiếp Tục` -> `Tiếp Theo`.
- [x] Revert passive `letter_listen` next-button pin-to-bottom behavior; position should match floor-3 lesson-1 (immediately under preview frame).

Notes
- Removed the temporary `pinNextButtonToBottom`/`pinPassiveNextButtonToBottom` layout override added in previous pass.
- Passive next button now uses standard `mt-4` placement under lesson preview for all passive lessons.

Validation
- `pnpm lint` pass
- `pnpm exec tsc --noEmit` pass
- Manual Playwright smoke:
  - Tower-1 floor-1 lesson-1: button label is `Tiếp Theo` and appears directly below preview frame.
  - Tower-1 floor-4 select: network requests show `intro.mp3` auto-played; `rules.mp3` is no longer auto-played on enter.

---

Update (Bubble tap SFX switch to mp3 assets)

TODO
- [x] Replace procedural bubble tap tones with file-based SFX.
- [x] Correct bubble tap (`kind: target`) now plays `pop.mp3`.
- [x] Wrong bubble tap (`kind: wrong`) now plays `wrong-answer.mp3`.
- [x] Empty bubble tap (`kind: empty`) stays silent (no SFX trigger).

Notes
- Removed `AudioContext`/oscillator logic from `Floor4BubbleChallenge` and switched to `new Audio(src)` one-shot playback for tap feedback.
- Added constants:
  - `TARGET_BUBBLE_HIT_AUDIO = /assets/audio/game/bubble-pop/pop.mp3`
  - `WRONG_BUBBLE_HIT_AUDIO = /assets/audio/feedback/wrong-answer.mp3`
- In `handleBubbleTap`:
  - target -> `playTapFeedbackAudio("target")`
  - wrong -> `playTapFeedbackAudio("wrong")`
  - empty -> no call (silent)

Validation
- `pnpm lint` pass
- `pnpm exec tsc --noEmit` pass
- Manual Playwright smoke on tower-1 floor-4:
  - tapped target and wrong bubbles via runtime state helper
  - observed audio requests:
    - `/assets/audio/game/bubble-pop/pop.mp3` (HTTP 206)
    - `/assets/audio/feedback/wrong-answer.mp3` (HTTP 206)
