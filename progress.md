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

---

Update (Lesson 3 drag stability + Bubble intro gating + Tower badge collection)

TODO
- [x] Fix lesson 3 word-build drag jitter near top-left/X area by hardening pointer handling.
- [x] Change floor-4 bubble intro audio so it only auto-plays once when entering from floor selection.
- [x] Add collectible tower badge unlock when a tower reaches full stars on all floors.
- [x] Add badge unlock popup overlay (dimmed background + pulsing glow) that dismisses only on tap.
- [x] Add a place to review collected badges from tower map header.
- [x] Re-validate lint/typecheck and interactive smoke flows.

Notes
- Lesson 3 drag hook (`use-word-build-drag`) now:
  - uses pointer capture during drag
  - temporarily forces `document.body.style.touchAction = "none"` while dragging and restores on release/cancel/unmount
  - rounds ghost coordinates before `translate3d` to reduce visual jitter
- Floor 4 bubble intro audio now uses a mount-lifetime guard (`hasPlayedSelectIntroRef`) so returning from result -> select does not replay intro.
- New badge storage module: `src/lib/tower-badges.ts`.
  - key: `asobeto-tower-badges-v1`
  - unlock key format: `${worldId}:${towerId}`
- New badge UI components:
  - `src/components/badges/tower-badge-sticker.tsx`
  - `src/components/badges/tower-badge-award-overlay.tsx`
  - `src/components/badges/tower-badge-collection-modal.tsx`
- Floor selection now auto-awards badge when all floors in the selected non-boss tower are at max stars and shows immediate popup.
- Tower map now has a header button to open the badge collection modal and show unlocked count (`x/y`).
- Important fix for high-star floors:
  - `src/lib/floor-progress.ts` now preserves stored floor stars above 3 when reading from localStorage (storage cap 99), then clamps per-floor max at hydration/read sites.
  - This prevents losing floor-3/floor-4 stars and is required for full-tower badge unlock logic.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Playwright MCP smoke checks:
  - Word-build drag across top-left close button zone keeps `app-scroll` `scrollTop` unchanged (`0 -> 0`) and drop still works.
  - Bubble intro audio count (`/assets/audio/game/bubble-pop/intro.mp3`) stays at `1` after fail -> result -> back to level select.
  - Badge popup appears immediately after opening a fully-maxed tower and dismisses on tap.
  - Badge collection modal on tower map shows unlocked progress and unlocked tower sticker state.

Follow-up suggestion
- Optional: add a compact CTA label near the tower-map badge icon (e.g. "Huy hiệu") for clearer discoverability on first use.

---

Update (Active-lesson celebration audio reliability + badge collection redesign)

TODO
- [x] Improve `StarCelebration` / `BrokenHeartCelebration` audio reliability in active lessons.
- [x] Move badge collection trigger outside world-map content area and redesign as colorful badge/collection CTA.
- [x] Redesign badge collection modal with green tone and larger `Bộ sưu tập huy hiệu` title.
- [x] Remove old star-style progress (`0/5`), show unlocked badge count only.
- [x] Replace star iconography with badge-like iconography.
- [x] Simplify badge card visuals (remove `Huy Hiệu` chip, sparkles, letter overlays, `Chưa mở`).
- [x] Center and enlarge lock icon for locked badges.
- [x] Tighten badge card frame and switch modal grid to 3 columns.
- [x] Use `font-hp-special` for badge tower labels.
- [x] Temporarily force-unlock all non-boss tower badges for testing.
- [x] Set tower A badge image to `anpanman.webp`.
- [x] Add tap-to-preview zoom behavior for each badge in collection.

Notes
- Added `src/lib/celebration-audio.ts`:
  - audio element cache by src
  - preload helper
  - retry-based `play()` helper for transient play failures.
- `StarCelebration` and `BrokenHeartCelebration` now use cached/retry playback.
- `LessonInterface` now preloads celebration success/fail audio when lesson screen mounts.
- Badge component file names were normalized from `tower-badge-*` to `badge-*` and exports updated.
- `tower-badges.ts` now includes:
  - `FORCE_UNLOCK_ALL_BADGES_FOR_TESTING = true`
  - `badgeImageSrc` in badge record
  - tower id `1` image override to `/assets/images/badges/anpanman.webp`.
- Collection modal updates:
  - green palette
  - title-only header (`Bộ sưu tập huy hiệu`)
  - 3-column badge grid
  - per-badge tap opens centered preview overlay.
- World map badge CTA now:
  - fixed outside map area (`bottom-right` floating action style)
  - medal icon
  - unlocked-count only (no denominator).

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Playwright smoke on `http://127.0.0.1:3100`:
  - world map shows floating badge CTA with medal icon and count-only text.
  - collection modal shows green style + 3-column grid + larger title.
  - tapping badge opens centered zoom preview overlay and dismisses on tap.
  - network requests include celebration audio in active lessons:
    - `/assets/audio/feedback/success-answer.mp3` (HTTP 206)
    - `/assets/audio/feedback/wrong-answer.mp3` (HTTP 206)
- `node $WEB_GAME_CLIENT ...` still cannot run in this environment because that script cannot resolve package `playwright` in its import path.

---

Update (World-map badge counter relocation + 29-letter collection pass)

TODO
- [x] Remove `HUY HIỆU` text and white icon chip from badge counter; keep icon + number only.
- [x] Move badge access from tower-map to world-map header (next to mascot, star-counter style).
- [x] Remove all tower-name labels below badge cells in collection modal.
- [x] Expand collection to 29 badges (29 Vietnamese letters via transliteration codes).
- [x] Set second badge (`AW`) image to `sailor-moon.webp`.
- [x] Update zoom preview to show badge only (no square frame style, no title text, no "chạm vào để tiếp tục").

Notes
- Added `getLetterBadgeCollection()` in `src/lib/tower-badges.ts` with 29 badge codes:
  - `A, AW, AA, B, C, D, DD, E, EE, G, H, I, K, L, M, N, O, OO, OW, P, Q, R, S, T, U, UW, V, X, Y`
- Badge image mapping now includes:
  - `A -> /assets/images/badges/anpanman.webp`
  - `AW -> /assets/images/badges/sailor-moon.webp`
- World-map header now includes clickable badge counter (`Medal + count`) and opens `TowerBadgeCollectionModal`.
- Removed badge floating CTA and modal mount from `tower-map` screen.
- Badge modal cell cards now render sticker only (no name caption below).
- `TowerBadgeSticker` now supports `variant="badgeOnly"` for preview mode.
- Preview overlay (`mode="preview"`) now renders only badge artwork (no extra text lines).

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Playwright smoke:
  - world-map header shows badge counter beside mascot with icon + number only.
  - badge modal opens from world-map; grid contains `29` entries.
  - no `Tháp ...` labels under badge items.
  - AW badge image resolves to `/assets/images/badges/sailor-moon.webp`.
  - preview overlay text is empty (no title / no “Chạm vào màn hình để tiếp tục”).
  - tower-map no longer shows badge entry button.

---

Update (Remove circular ring in badge zoom preview)

TODO
- [x] Remove circular ring/background artifacts behind badge when zooming in preview mode.

Notes
- In `TowerBadgeAwardOverlay`, preview mode no longer renders the extra circular glow layer.
- In `TowerBadgeSticker` (`variant="badgeOnly"`), removed circular border classes around the badge image/icon/lock variants.
- Preview now shows cleaner badge-only zoom without ring behind.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.

---

Update (Keep glow pulse in preview while removing white circular border)

TODO
- [x] Remove white circular border behind zoomed badge in preview mode.
- [x] Keep soft pulsing glow effect during preview.

Notes
- `TowerBadgeAwardOverlay` now keeps animated glow in preview mode with emerald-tinted blur, preserving mờ-sáng pulse.
- `TowerBadgeSticker` (`variant="badgeOnly"`) removed white border classes around preview badge image/icon/lock.
- Added slight image zoom (`scale-[1.06]`) in badge-only preview to hide edge artifacts from source assets.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Playwright check confirms:
  - overlay glow layer exists in preview
  - preview badge container has no `border-white` classes.

---

Update (Make zoomed badge white ring transparent)

TODO
- [x] Keep existing preview effects and make the white circular border transparent.

Notes
- Updated preview badge image wrapper in `badgeOnly` variant from `border-white/80` to `border-transparent`.
- All glow/scale animations remain unchanged.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.

---

Update (Bubble floor-4 star rules by lives/time)

TODO
- [x] Change `normal` star logic: pass with no life lost => 2 stars; pass with >=1 life lost => 1 star.
- [x] Change `hard` star logic: no life lost + timeLeft > 9s => 3 stars; no life lost + timeLeft <= 9s => 2 stars; >=1 life lost => 1 star.
- [x] Use computed stars consistently for pass celebration and final result persistence (instead of fixed `starsReward`).
- [x] Re-run lint and typecheck.
- [x] Re-validate gameplay outcomes via Playwright MCP state-driven runs.

Notes
- Implemented `getEarnedStarsOnPass(level)` in `src/screens/floor4-bubble-challenge.tsx` using `livesRef` and `timeLeftRef`.
- `triggerLevelPass` now computes stars once and passes that value through celebration + finalize flow.
- `finalizeLevel` now accepts optional computed stars and clamps pass result to `[1..level.starsReward]`.

Validation
- Static checks:
  - `pnpm lint` pass
  - `pnpm exec tsc --noEmit` pass
- Runtime checks (Playwright MCP, using `render_game_to_text` + localStorage):
  - Normal, no life lost: `lives=3`, `timeLeft=11.75`, stored `normal=2`.
  - Normal, lost 1 life: `lives=2`, `timeLeft=5.04`, stored `normal=1`.
  - Hard, lost 1 life: `lives=2`, `timeLeft=13.06`, stored `hard=1`.
  - Hard, no life lost and `timeLeft=12.44 (>9)`: stored `hard=3`.
  - Hard, no life lost and `timeLeft=5.65 (<=9)`: stored `hard=2`.
- `node $WEB_GAME_CLIENT` still cannot run in this environment because skill script dependency `playwright` is missing at `/Users/quylang/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js`.

---

Update (Bubble star logic moved to data config)

TODO
- [x] Add data schema for pass-star rules per bubble level.
- [x] Move star-award logic in `Floor4BubbleChallenge` to read rules from level config.
- [x] Add shared rule constants and wire `normal` / `hard` floor-4 levels across towers 1..5.
- [x] Re-run lint and typecheck.
- [x] Re-verify runtime behavior for key star-award branches.

Notes
- Added `BubblePassStarRule` and `passStarRules` to bubble level config schema in `src/data/world-1-alphabet/map-structure.ts`.
- Added shared rule data in `src/data/world-1-alphabet/bubble-star-rules.ts`:
  - `normal`: no life lost => 2 stars, lost >=1 life => 1 star.
  - `hard`: no life lost + `timeLeft > 9` => 3 stars, no life lost + `timeLeft <= 9` => 2 stars, lost >=1 life => 1 star.
- Floor-4 data for tower 1..5 now references these rules directly, so future tuning only needs data edits.
- `Floor4BubbleChallenge` now evaluates rule list in order and falls back to `starsReward` when no rule matches.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Playwright MCP runtime checks (state from `render_game_to_text` + localStorage):
  - Normal, no life lost: `lives=3`, stored `normalStars=2`.
  - Normal, lost 1 life: `lives=2`, stored `normalStars=1`.
  - Hard, no life lost and `timeLeft=18.03 (>9)`: stored `hardStars=3`.
  - Hard, no life lost and `timeLeft=8.55 (<=9)`: stored `hardStars=2`.
  - Hard, lost 1 life: `lives=2`, stored `hardStars=1`.
