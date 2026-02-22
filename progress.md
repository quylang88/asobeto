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
- [x] Use the new spelling file path for word `cá` (`intro-words/fish/spelling.mp3`) in pronunciation_practice.
- [x] Remove bubble game `speechSynthesis` usage and replace with mp3 playback from `assets/audio/game/bubble-pop` (`intro`, `rules`, `target-*`).

Notes
- `LessonAudioVariant`, `AudioPlaybackSpeed`, and `requiredPlaybackSpeeds` were removed from world-1 map structure.
- Passive preview renderer no longer renders speed buttons (`Chậm/Thường/Nhanh`); replay uses one default lesson audio.
- Letter lesson templates now use:
  - intro: `/assets/audio/intro-letters/<assetKey>/intro-{1..4}.mp3`
  - main audio: `/assets/audio/letters/<assetKey>.mp3`
- Vocabulary templates now use:
  - intro: `/assets/audio/intro-words/<assetKey>/intro-{1..4}.mp3`
  - spelling (pronunciation_practice): `/assets/audio/intro-words/<assetKey>/spelling.mp3`
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

---

Update (Randomize answer order for lesson 2 quiz)

TODO
- [x] Randomize answer positions for `letter_quiz` so the correct option is no longer fixed at index 1.
- [x] Keep answer order stable while staying in the same lesson step (avoid reshuffle mid-question).
- [x] Preserve existing scoring logic by still passing full `LessonAnswer` object to `handleAnswer`.
- [x] Re-run lint and typecheck.

Notes
- Added local answer shuffle helper in `src/screens/lesson-interface.tsx`.
- Added `getDisplayAnswersForLesson` to apply shuffle only for `letter_quiz`.
- Introduced `answerOptions` state that refreshes when `currentLesson` changes, ensuring each new lesson entry can have a new answer order.
- Updated `LessonActiveRenderer` to render from `answerOptions` prop instead of directly from `currentLesson.answers`.

Validation
- `pnpm lint -- src/screens/lesson-interface.tsx src/screens/lesson-interface/renderers/active-renderer.tsx` pass.
- `pnpm exec tsc --noEmit` pass.

---

Update (Add tracing data for letters "ă" and "n")

TODO
- [x] Add tracing stroke definition for letter `ă` by reusing `a` and adding one breve mark above.
- [x] Add tracing stroke definition for letter `n` with 2 distinct strokes following the provided writing flow.
- [x] Register `ă` and `n` in `LETTER_STROKE_MAP`.
- [x] Re-run typecheck and lint for changed files.
- [x] Attempt web-game Playwright loop from skill workflow.

Notes
- Added `src/data/tracing/letters/aw.ts`:
  - Reuses `letterStrokeA.strokes`.
  - Adds one extra breve stroke above the base glyph so `ă` keeps the same base flow as `a`.
- Added `src/data/tracing/letters/n.ts`:
  - Uses `layout.columns = 4` / `rows = 4` to match the 4-box horizontal structure from the reference.
  - Stroke 1 is constrained inside box 1.
  - Stroke 2 starts in box 2, loops down then up, and ends around half of box 4.
- Updated `src/data/tracing/letters/index.ts` mapping:
  - `"ă" -> letterStrokeAw`
  - `"n" -> letterStrokeN`

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint -- src/data/tracing/letters/aw.ts src/data/tracing/letters/n.ts src/data/tracing/letters/index.ts` pass.
- `node $WEB_GAME_CLIENT ...` failed in this environment because skill script dependency `playwright` is missing:
  - `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'playwright' imported from /Users/quylang/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js`.

---

Update (Adjust `ă` breve direction/size + refine `n` tracing shape)

TODO
- [x] Flip `ă` breve direction to match requested shape.
- [x] Shift breve slightly left and reduce its size.
- [x] Redraw `n` to better match provided reference (2 separate strokes and end position in box 4).
- [x] Re-run typecheck and lint.

Notes
- Updated `src/data/tracing/letters/aw.ts`:
  - breve now uses a downward-bending arc (fixed orientation),
  - moved left by ~10px,
  - reduced width/height for a tighter accent mark.
- Updated `src/data/tracing/letters/n.ts`:
  - stroke 1 kept compact in cell 1, with short downward finish,
  - stroke 2 starts in cell 2, drops to baseline, arches, then returns and ends around half-height in cell 4.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint -- src/data/tracing/letters/aw.ts src/data/tracing/letters/n.ts` pass.

---

Update (Reposition `n` strictly by user ĐK coordinates)

TODO
- [x] Rebuild stroke 1 for `n` from left edge of box 1, start between ĐK2-ĐK3, touch ĐK3, then descend along left edge of box 2 to ĐK1.
- [x] Rebuild stroke 2 for `n` from intersection of ĐK2 and left edge box 2, rise to middle of box 3, descend lightly curved to ĐK1, then hook up to ĐK2 at center of box 4.
- [x] Keep `ă` breve previous left/size reduction unchanged.
- [x] Re-run lint/typecheck.

Notes
- Updated `src/data/tracing/letters/n.ts` coordinates:
  - Stroke 1 start: `{ x: 18, y: 176 }`, touches ĐK3 at `{ y: 140 }`, ends ĐK1 at `{ x: 70, y: 280 }`.
  - Stroke 2 start: `{ x: 70, y: 210 }` (ĐK2 + left edge box 2), rises to `{ x: 176, y: 175 }` (middle box 3), descends to `{ x: 214, y: 280 }` (ĐK1), ends `{ x: 245, y: 210 }` (ĐK2 center box 4).
- This pass prioritizes geometric placement by the user’s ĐK instructions over previous freehand approximation.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint -- src/data/tracing/letters/n.ts src/data/tracing/letters/aw.ts` pass.

---

Update (Smooth curvature pass for letter `n`)

TODO
- [x] Keep user-locked ĐK anchors for `n` and soften all curve transitions.
- [x] Smooth stroke-1 top turn and downstroke entry.
- [x] Smooth stroke-2 arch, downstroke, and bottom hook-up return.
- [x] Re-run typecheck and lint.

Notes
- Updated `src/data/tracing/letters/n.ts` control points for softer bezier flow:
  - Stroke 1 now transitions from top loop into downstroke without the previous bend kink.
  - Stroke 1 endpoint is restored to đáy ĐK1 (`y: 280`) for consistency.
  - Stroke 2 keeps start/end anchors but uses gentler control handles for:
    - rise to middle of box 3,
    - near-straight slight-curved descent to ĐK1,
    - smooth bottom turn and return to ĐK2 center of box 4.
- Geometric anchors from the user spec remain unchanged:
  - stroke 2 start `{ x: 70, y: 210 }`
  - stroke 2 end `{ x: 245, y: 210 }`

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint -- src/data/tracing/letters/n.ts` pass.

---

Update (Fix fog overlay for lesson-2 `n` and make fog auto-fit any tracing grid size)

TODO
- [x] Fix fog mismatch in `letter_quiz` preview for letter `n` (4-column tracing layout).
- [x] Remove hardcoded fog `width/height` coupling to default tracing size.
- [x] Make fog canvas auto-resize to real rendered container size (works for variable rows/columns/cell sizes).
- [x] Keep erase coordinate mapping correct after dynamic resizing.
- [x] Re-run typecheck/lint and runtime smoke navigation.

Notes
- Root cause:
  - `FogRevealOverlay` used fixed `LETTER_TRACING_CANVAS_WIDTH/HEIGHT` (default 3x4 grid).
  - Letter `n` uses custom `layout.columns = 4`, so fog didn’t fully cover the tracing frame.
- Code changes:
  - `src/screens/lesson-interface/components/fog-reveal-overlay.tsx`
    - removed required props `width` and `height`.
    - added runtime size measurement via `getBoundingClientRect()` on canvas.
    - added `ResizeObserver` + redraw to keep fog synced when container size changes.
    - fog drawing now uses measured width/height and scales bitmap by DPR.
    - pointer erase mapping now uses current measured canvas size from ref.
    - removed forced `style.width/style.height` locking; overlay keeps `absolute inset-0` fill behavior.
  - `src/screens/lesson-interface/renderers/passive-preview-renderer.tsx`
    - removed imports/usages of `LETTER_TRACING_CANVAS_WIDTH/HEIGHT`.
    - simplified `FogRevealOverlay` usage to `revealKey + roundedClassName`.

Validation
- Static checks:
  - `pnpm exec tsc --noEmit` pass.
  - `pnpm lint -- src/screens/lesson-interface/components/fog-reveal-overlay.tsx src/screens/lesson-interface/renderers/passive-preview-renderer.tsx` pass.
- Runtime checks:
  - Dev server restarted cleanly on `127.0.0.1:3100` after clearing stale processes/lock.
  - Navigated via Playwright MCP to tower `ă` -> floor `n` -> lesson `2/4` (`Nghe và chọn chữ cái`) and confirmed fog overlay node renders on the tracing preview.
  - Some Playwright MCP deep DOM inspection calls timed out in this environment, so full numeric canvas-rect dump could not be collected.
- Skill script status:
  - `node $WEB_GAME_CLIENT ...` still fails in this environment due missing dependency:
    - `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'playwright' imported from /Users/quylang/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js`.

---

Update (Hotfix fog overflow regression)

TODO
- [x] Fix regression where fog overlay could expand beyond tracing preview bounds.
- [x] Anchor fog size/position to dedicated tracing preview container.
- [x] Verify lesson-2 `n` fog bounding box is no longer fullscreen.

Notes
- Added `containerRef` support in `FogRevealOverlay` and measure from that container (instead of relying on fog canvas box alone).
- Restored explicit `fogCanvas.style.width/height` using measured container dimensions.
- In passive preview renderer, wrapped `LetterTracingCanvas` in a dedicated `relative w-fit` container and passed that ref to `FogRevealOverlay`.
- This keeps fog clipped to tracing preview while still supporting dynamic tracing layouts.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint -- src/screens/lesson-interface/components/fog-reveal-overlay.tsx src/screens/lesson-interface/renderers/passive-preview-renderer.tsx` pass.
- Playwright MCP runtime check at tower `ă` -> floor `n` -> lesson `2/4`:
  - fog bounding box: `{ width: 296, height: 302 }`
  - confirms fog is bounded to preview frame (not viewport-wide).

---

Update (Add 1000ms pause between stroke 2 and stroke 3 for `ă` only)

TODO
- [x] Add `pauseAfterMs: 1000` after stroke 2 of letter `ă`.
- [x] Keep base letter `a` timing unchanged.
- [x] Re-run lint/typecheck.

Notes
- Updated `src/data/tracing/letters/aw.ts`:
  - `letterStrokeAw` now clones `letterStrokeA.strokes` and sets pause only for index `1` (stroke 2).
  - This ensures pause is applied only in the `ă` animation path before drawing the breve stroke.
  - No mutation is applied back to `letterStrokeA`.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint -- src/data/tracing/letters/aw.ts` pass.

---

Update (Further adjust `ă` breve + rebuild `n` stroke flow by ĐK instructions)

TODO
- [x] Move `ă` breve further left and make it a bit smaller.
- [x] Redraw `n` stroke 1 as a smoother, short móc xuôi ending on ĐK1.
- [x] Redraw `n` stroke 2 to start exactly at stroke-1 endpoint, rise near ĐK3, then write móc hai đầu ending on ĐK2.
- [x] Re-run typecheck and lint.

Notes
- `src/data/tracing/letters/aw.ts`
  - breve changed from `(108..178)` to `(100..160)` range and reduced vertical span.
  - keeps downward-bending arc orientation.
- `src/data/tracing/letters/n.ts`
  - Stroke 1 now starts at `y=172` (between middle lines), touches lower line and ends at baseline `y=280`.
  - Stroke 2 now starts from `{ x: 76, y: 280 }`, rises to near top writing line (`y~154`), descends smoothly, then hooks up and ends at `y=214` (mid line / ĐK2 target).
  - Curve controls updated to remove kinks and make arch/return more rounded.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint -- src/data/tracing/letters/aw.ts src/data/tracing/letters/n.ts` pass.

---

Update (Tower 4 vocab remap + new floor icons)

TODO
- [x] Keep tower-4 floor-1 as letter `o` (unchanged).
- [x] Convert tower-4 floor-2 to vocabulary word `cỏ`.
- [x] Keep tower-4 floor-3 as vocabulary word `bò` and swap icon.
- [x] Add new cute icons `cor-svg` (grass) and `bof-svg` (cow).
- [x] Add green/orange tone support for floor selection icon wrapper.
- [x] Standardize all vocabulary floor card title/description to:
  - title: `Từ vựng`
  - description: `Ghép từ, luyện nói và viết`
- [x] Run lint/typecheck and UI smoke verification.

Notes
- Added new selection icon types in map schema: `cor-svg`, `bof-svg`.
- `SvgWrapper` now supports `tone="green" | "orange"`.
- Tower-4 mapping now:
  - Floor 1: letter learning `o`
  - Floor 2: vocabulary `cỏ` with `cor-svg` and green tone
  - Floor 3: vocabulary `bò` with `bof-svg` and orange tone
  - Floor 4: bubble mini game
- `createVocabularyLearningFloor` now enforces shared card copy for all vocab floors and supports optional `colorVariant` (`orange` default, `green` for floor-2 tower-4).
- Validation:
  - `pnpm lint` pass
  - `pnpm exec tsc --noEmit` pass
  - Playwright snapshot confirmed tower-4 floor labels and icon tones:
    - floor-2 wrapper class contains `border-green-300 ... from-green-200 to-emerald-300`
    - floor-3 wrapper class contains `border-orange-300 ... from-orange-200 to-amber-300`

---

Update (Tower 5 remap to `m, e, mẹ` + icon `mej.svg`)

TODO
- [x] Change tower 5 labels to `m, e, mẹ`.
- [x] Convert tower 5 lessons: floor-1 `m`, floor-2 `e`, floor-3 vocabulary `mẹ`.
- [x] Add new floor selection icon `mej-svg` (mother), similar visual style to father icon.
- [x] Wire `mej-svg` into icon union + floor selection renderer.
- [x] Add requested asset file `public/assets/images/mej.svg`.
- [x] Validate with lint + typecheck + UI smoke check.

Notes
- Updated `src/data/world-1-alphabet/map-structure.ts`:
  - `FloorSelectionIcon` includes `mej-svg`.
  - tower-5 title/letters now show `m` and `m, e, mẹ`.
- Updated tower-5 lesson definitions:
  - `src/data/world-1-alphabet/tower-5/floor-1.ts` -> letter `m`
  - `src/data/world-1-alphabet/tower-5/floor-2.ts` -> letter `e`
  - `src/data/world-1-alphabet/tower-5/floor-3.ts` -> word `mẹ` (tokens: `m`, `e`, `tone-nang`)
  - `src/data/world-1-alphabet/tower-5/floor-4.ts` -> bubble targets `m`, `e`
  - `src/data/world-1-alphabet/tower-5/index.ts` floor-3 `selectionIcon` -> `mej-svg`
- Added mother icon component + export:
  - `src/screens/floor-selection/components/mej-svg.tsx`
  - `src/screens/floor-selection/components/index.ts`
- Added renderer branch for `mej-svg` in:
  - `src/screens/floor-selection/index.tsx`
- Added raw asset file:
  - `public/assets/images/mej.svg`

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Playwright MCP smoke check:
  - tower-5 card displays `m`
  - floor labels display `Chữ m`, `Chữ e`
  - floor-3 icon renders with alt text `Mẹ`.

---

Update (Swap floor 1 <-> 2 for tower 3 and tower 5)

TODO
- [x] Swap tower-3 floor order between floor 1 and floor 2.
- [x] Swap tower-5 floor order between floor 1 and floor 2.
- [x] Keep floor 3/4 unchanged for both towers.
- [x] Validate with lint/typecheck and UI smoke test.

Notes
- Updated `src/data/world-1-alphabet/tower-3/index.ts`:
  - floor `id:1` now maps to `Chữ ô` with `content: floor2Lessons`.
  - floor `id:2` now maps to `Chữ b` with `content: floor1Lessons`.
- Updated `src/data/world-1-alphabet/tower-5/index.ts`:
  - floor `id:1` now maps to `Chữ e` with `content: floor2Lessons`.
  - floor `id:2` now maps to `Chữ m` with `content: floor1Lessons`.

Validation
- `pnpm lint -- src/data/world-1-alphabet/tower-3/index.ts src/data/world-1-alphabet/tower-5/index.ts` pass.
- `pnpm exec tsc --noEmit` pass.
- `$WEB_GAME_CLIENT` run failed in this environment due missing dependency:
  - `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'playwright' imported from .../web_game_playwright_client.js`
- Playwright MCP smoke check passed:
  - Tower 3 floor list shows `1: Chữ ô`, `2: Chữ b`.
  - Tower 5 floor list shows `1: Chữ e`, `2: Chữ m`.

---

Update (Tracing chữ e dùng glyph font hp-special + khung 2x3)

TODO
- [x] Đổi tracing `e` sang render theo glyph font hp-special thay vì path thủ công.
- [x] Giữ grid layout hiện tại (`columns/rows`) và thêm cấu hình tọa độ bounds để chữ `e` nằm trong vùng 2 cột x 3 hàng.
- [x] Tăng độ đậm nét và scale chữ để to ngang mẫu tracing hiện tại.
- [x] Mở rộng canvas tracing để hỗ trợ glyph config cho guide/preview/demo/chấm điểm.
- [x] Chạy lint + typecheck lại.

Notes
- Thêm kiểu dữ liệu glyph tracing:
  - `src/data/tracing/types.ts`: `TracingGlyphBounds`, `TracingGlyphConfig`, `LetterStrokeAnimation.glyph`.
  - `src/data/tracing/index.ts`: export các kiểu mới.
- Thêm tracing cho chữ `e` tại `src/data/tracing/letters/e.ts` và đăng ký vào map:
  - `src/data/tracing/letters/index.ts`.
- Cấu hình `e`:
  - layout giữ nguyên `columns: 3`, `rows: 4`.
  - font: `"HP001_4_hang_bold", "Mali", sans-serif`.
  - `fontWeight: 900`, `sizeScale: 1.18`.
  - bounds source 280-space: `x: 46.67`, `y: 35`, `width: 186.67` (~2 cột), `height: 210` (~3 hàng).
- `letter-tracing-canvas` cập nhật logic fit glyph theo bounds + text metrics và dùng chung ở các pha:
  - guide
  - preview fill
  - demo animation fallback
  - raster target cho evaluation

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Đã thử smoke Playwright MCP, app lên được nhưng chưa chụp xác nhận trực tiếp màn tracing chữ `e` do flow click vào màn bài học chưa ổn định.

---

Update (Tracing chữ e theo nét stroke + chạm line 3)

TODO
- [x] Đổi glyph `e` từ fill sang stroke để đúng cảm giác tô theo nét.
- [x] Thêm tuỳ chọn glyph render mode/độ dày/vertical align cho tracing canvas.
- [x] Chỉnh lại bounds chữ `e` để đỉnh chữ chạm line 3 và tăng cỡ chữ.
- [x] Chạy lint + typecheck.

Notes
- Mở rộng `TracingGlyphConfig` với:
  - `renderMode: "fill" | "stroke"`
  - `strokeWidthScale`
  - `verticalAlign: "center" | "top"`
- `drawGuideGlyph` trong `letter-tracing-canvas` nay hỗ trợ vẽ `strokeText` với độ dày theo `strokeWidthHint` và scale cấu hình glyph.
- Với chữ `e`:
  - `renderMode: "stroke"`
  - `strokeWidthScale: 1.3`
  - `verticalAlign: "top"`
  - bounds source-space: `x: 32`, `y: 140`, `width: 196`, `height: 120`
  - `sizeScale: 1.32`

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.

---

Update (Tracing chữ e: glyph hp-special trong vùng 2x2 + demo đi theo nét viết)

TODO
- [x] Giữ layout khung tracing hiện tại (3 cột x 4 hàng) và giới hạn chữ `e` vào vùng 2 cột x 2 hàng đầu.
- [x] Dùng glyph font hp-special cho mẫu chữ `e` với tọa độ cấu hình được.
- [x] Tăng độ đậm nét + tăng size để ngang cỡ tracing hiện tại.
- [x] Giữ animation demo tô nét theo thứ tự viết (từ trái vòng cung lên, kết thúc nét phải).
- [x] Re-run lint + typecheck.

Notes
- Mở rộng `TracingGlyphConfig` trong `src/data/tracing/types.ts`:
  - `renderMode`, `strokeWidthScale`, `verticalAlign`.
- `LetterTracingCanvas` được cập nhật để:
  - ưu tiên vẽ guide/preview/evaluation theo `glyph` khi có cấu hình glyph.
  - vẫn giữ demo animation theo `strokes` nếu chữ có định nghĩa path.
  - hỗ trợ bounds mapping theo source-space (280) để canh tọa độ chính xác theo ô ly.
- Cấu hình mới cho `e` trong `src/data/tracing/letters/e.ts`:
  - glyph font: `"HP001_4_hang_bold", "Mali", sans-serif`
  - `fontWeight: 900`, `renderMode: "stroke"`, `strokeWidthScale: 1.42`, `sizeScale: 1.25`
  - bounds 2x2 đầu: `x: 6`, `y: 8`, `width: 178`, `height: 132`
  - thêm 1 stroke path demo viết theo chiều yêu cầu (bắt đầu trái, vòng lên, kết thúc phải).

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.

---

Update (Tinh chỉnh chữ e: hạ xuống hàng thấp + giảm độ dày nét)

TODO
- [x] Đẩy chữ `e` xuống sát vùng hàng thấp nhất.
- [x] Giảm độ đậm để chữ `e` nhìn rõ form hơn (thanh mảnh hơn).
- [x] Re-run lint + typecheck.

Notes
- `src/data/tracing/letters/e.ts`:
  - `glyph.bounds.y`: `8 -> 148` (giữ `width: 178`, `height: 132`, đẩy vùng chữ xuống thấp).
  - `fontWeight`: `900 -> 700`.
  - `strokeWidthScale`: `1.0 -> 0.72` để giảm độ dày nét stroke.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.

---

Update (Chữ e: bỏ stroke-outline, mảnh hơn, canh ĐK3-ĐK1)

TODO
- [x] Bỏ kiểu vẽ stroke-outline cho glyph `e` để không bị hở chữ.
- [x] Giảm độ đậm chữ `e` cho mảnh hơn.
- [x] Chỉnh bounds để đỉnh chạm ĐK3 và đáy chạm ĐK1.
- [x] Đồng bộ lại stroke path demo để đi đúng vùng mới.
- [x] Re-run lint + typecheck.

Notes
- `src/data/tracing/letters/e.ts` cập nhật:
  - `fontWeight: 500` (mảnh hơn)
  - bỏ `renderMode: "stroke"` và `strokeWidthScale`
  - `sizeScale: 1.08`
  - bounds: `x: 8`, `y: 70`, `width: 186`, `height: 140` (top ĐK3, bottom ĐK1)
- Stroke demo path của `e` được dời/tỉ lệ lại để bám cùng dải cao độ ĐK3->ĐK1 và vẫn giữ thứ tự viết từ trái lên vòng cung rồi kết nét phải.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.

---

Update (Switch tracing e font to HP normal)

TODO
- [x] Confirm tracing `e` uses `HP001_4_hang_normal`.
- [x] Re-run lint + typecheck.

Notes
- `src/data/tracing/letters/e.ts` is already set to:
  - `fontFamily: "HP001_4_hang_normal", "Mali", sans-serif`.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.

---

Update (Fix font-face HP special load)

TODO
- [x] Verify `globals.css` font-face mapping for `HP001_4_hang_bold` / `HP001_4_hang_normal`.
- [x] Split invalid combined `@font-face` into two valid declarations.
- [x] Align tracing `e` to use lighter normal weight (`400`).
- [x] Re-run lint + typecheck.

Notes
- Root cause: `@font-face` was declared with two family names in one rule, which is invalid and can break both fonts.
- `src/app/globals.css` now has 2 independent rules:
  - `font-family: "HP001_4_hang_normal"` -> `/fonts/HP001_4_hang_normal.woff2`
  - `font-family: "HP001_4_hang_bold"` -> `/fonts/HP001_4_hang_bold.woff2`
- `src/data/tracing/letters/e.ts`: `fontWeight` set to `400` for thinner `e`.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.

---

Update (Simplify tracing e glyph config: only x/y + sizeScale)

TODO
- [x] Refactor glyph config to only support positional `x/y` and `sizeScale` for letter tracing use case.
- [x] Remove `bounds` (`width/height`), `verticalAlign`, `renderMode`, and `strokeWidthScale` from tracing glyph contract.
- [x] Set default glyph font family to `HP001_4_hang_normal` when glyph config does not provide one.
- [x] Update letter `e` tracing config to use only `x/y/sizeScale` (no explicit fontFamily, no width/height).
- [x] Re-run lint + typecheck.

Notes
- `src/data/tracing/types.ts`
  - `TracingGlyphConfig` now: `text`, `fontFamily`, `fontWeight`, `sizeScale`, `x`, `y`.
  - Removed `TracingGlyphBounds` and all old glyph-only rendering fields.
- `src/screens/lesson-interface/components/letter-tracing-canvas.tsx`
  - Glyph draw model now maps `x/y` from source-space (280) to tracing grid for left/top placement.
  - Font size is controlled by `guideFontSize * sizeScale`.
  - Default glyph font now falls back to `"HP001_4_hang_normal", "Mali", sans-serif` when `glyph` exists.
  - Glyph rendering is fill-only.
- `src/data/tracing/letters/e.ts`
  - `glyph` keeps only: `text`, `fontWeight`, `sizeScale`, `x`, `y`.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.

---

Update (Lesson 3 trace demo: data-driven stroke timeline + configurable pauses)

TODO
- [x] Replace generic fade demo with stroke-by-stroke timeline rendering in `LetterTracingCanvas`.
- [x] Add reusable tracing demo schema for per-letter strokes, configurable pause points, and default pause timing.
- [x] Keep fallback demo behavior for keys without stroke config.
- [x] Add stroke demo data for current alphabet set (`a, ă, b, c, e, m, n, o, ô`).
- [x] Re-run lint + typecheck.

Notes
- `src/data/tracing/types.ts`
  - Added demo config contracts:
    - `TracingStrokePoint`
    - `TracingPausePoint` (`pointIndex`, optional `pauseMs`)
    - `TracingStrokePath` (`points`, optional `durationMs`, `pauseBeforeMs`, `pauseAfterMs`, `pausePoints`)
    - `TracingDemoAnimationConfig` (`pauseMs`, `strokeDurationMs`, `strokes`)
  - `LetterStrokeAnimation` now supports `demo?: TracingDemoAnimationConfig`.
- `src/screens/lesson-interface/components/letter-tracing-canvas.tsx`
  - Added timeline engine to animate demo by path segments instead of drawing full glyph fade.
  - Default pause between strokes is now `800ms` (`DEFAULT_DEMO_PAUSE_MS`), overridable per letter/stroke/pause-point.
  - Supports per-point pause via `pausePoints` and dynamic start/end via first/last point in each stroke path.
  - Keeps legacy fallback fade animation if a tracing key has no `demo.strokes`.
- `src/data/tracing/letters/*.ts`
  - Added `demo.strokes` definitions for all currently shipped lesson letters:
    - `a.ts`, `aw.ts`, `b.ts`, `c.ts`, `e.ts`, `m.ts`, `n.ts`, `o.ts`, `oo.ts`.
  - Multi-stroke letters now naturally pause between strokes with default 800ms unless overridden.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint` pass.
- Playwright MCP smoke run could not be executed in this environment due persistent Chrome profile lock / launch timeout in MCP browser context.

---

Update (Auto tracing path generation for lesson 3 demo)

TODO
- [x] Replace Euler-edge traversal with centerline trail extraction to avoid backtracking loops in auto demo strokes.
- [x] Keep auto-demo reusable by letter (single/multi stroke via `strokeCount` + `strokeHints`).
- [x] Preserve default pause behavior (`pauseMs` default 800) and per-letter pause/start/end overrides.
- [x] Verify visual output on both 1-stroke and 2-stroke letters.

Notes
- `LetterTracingCanvas` auto pipeline now extracts stroke trails by skeleton graph path walking (key-node + cycle handling), instead of traversing every edge Euler-style.
- This removes the previous "scribble/backtrack" behavior where demo animation could leave the intended glyph path.
- Candidate normalization order was adjusted:
  - merge/split to target stroke count first
  - then apply hint mapping (`start/end`) and direction selection
- Added candidate noise filter (short spur rejection by relative path length).
- Source-point mapping now clamps to glyph bounds, so auto-generated strokes stay inside drawing area.

Validation
- `pnpm exec tsc --noEmit` pass.
- Playwright smoke screenshots:
  - `tmp/before-auto-trace-a.png` (before patch)
  - `tmp/after-auto-trace-a-v2.png` (after patch, letter `a`)
  - `tmp/after-auto-trace-aw.png` (after patch, letter `ă` with 2 strokes)
- Existing unrelated issue observed: missing audio files for `aw` (`/assets/audio/intro-letters/aw/*.mp3`, `/assets/audio/letters/aw.mp3`) still logs load errors.

Update (Auto tracing safety + continuity pass for letter `ă` demo)

TODO
- [x] Prevent unsafe cross-component joining (no bridging line between disconnected glyph parts).
- [x] Allow safe joining only when connector stays inside glyph mask.
- [x] Reduce stroke jitter by smoothing + point-density reduction.
- [x] Tune `ă` demo pauses to avoid visible stutter between body and breve.

Notes
- `GeneratedStrokeCandidate` now carries `componentId` and merge only occurs within same component.
- Added glyph-mask connector validator (`isConnectorInsideGlyphMask`) so long joins are accepted only if samples stay inside filled glyph area.
- If target stroke normalization cannot be reached safely, renderer keeps complete candidate set instead of dropping segments.
- Added lightweight smoothing and spacing normalization in candidate creation to make animation more fluid.
- For `ă` (`src/data/tracing/letters/aw.ts`): set first stroke `pauseAfterMs: 220` and removed explicit `pauseBeforeMs` on second stroke.

Validation
- `pnpm exec tsc --noEmit` pass.
- Playwright demo screenshots for letter `ă` lesson 3:
  - `tmp/demo-aw-after-safety-1.2s.png` (mid animation)
  - `tmp/demo-aw-after-mask-merge-final.png` (final frame)

Update (Auto demo alignment + curve quality hardening for `ă`)

TODO
- [x] Guarantee auto-demo paint stays inside glyph bounds during animation.
- [x] Improve curve smoothness to avoid jagged/angled segments.
- [x] Ensure final painted result matches underlying faded glyph shape.

Notes
- In `letter-tracing-canvas.tsx`:
  - Auto demo now clips painted timeline with glyph mask using `destination-in` each frame.
  - Final frame forces full glyph fill in trace color for exact visual parity with guide glyph.
  - Trail-to-source conversion now keeps sub-pixel precision (no integer rounding).
  - Added Chaikin smoothing + distance-based resampling for rounder curves.
- Existing component-safe merge guards remain in place, so disconnected parts stay disconnected unless connector is safely inside glyph mask.

Validation
- `pnpm exec tsc --noEmit` pass.
- Playwright (letter `ă`, lesson 3) screenshots:
  - `tmp/demo-aw-smooth-mask-1.3s.png`
  - `tmp/demo-aw-smooth-mask-0.45s.png`

---

Update (Tower 2 floor 4: diacritic-build mini game)

TODO
- [x] Add data model for reusable "ghép dấu tạo chữ" mini game config (letter, marker, debris, per-level rules, tutorial rule).
- [x] Add lesson template factory for this new game type.
- [x] Switch tower-2 floor-4 from bubble challenge to diacritic-build challenge with config for `a + ˘ => ă`.
- [x] Add dedicated floor-4 game screen for diacritic-build gameplay and route by lesson kind.
- [x] Run lint + typecheck + gameplay smoke validation.

Notes
- Added `lessonKind: "diacritic_build_challenge"` and `diacriticBuildGame` typed config in world-1 map structure.
- New config supports reusable knobs: `targetLetter`, `baseLetter`, `markerSymbol`, `debrisSymbols`, lanes, hitbox scale, per-level spawn/fall/timer/lives/progress goals, and tutorial replay rules.
- Implemented requested loop in the new screen:
  - Header HUD: hearts (left), large target letter + progress (center), timer (right).
  - Bubble-style playfield with 3 vertical lanes and in-frame footer action area (slot + base letter).
  - Tap correct marker: animated curved flight to slot, morph base letter -> target letter, sparkle, progress +1, auto reset.
  - Tap debris: life loss + buzz + light shake + red flash.
  - Marker falls out: no life penalty.
  - Anti-bad-luck spawn rule: max 3 debris in a row before forcing marker spawn.
  - Easy-only tutorial replay logic: show at first play and again after 2 failed easy attempts.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Manual Playwright smoke (`http://127.0.0.1:3100`):
  - Entered tower `ă` floor-4 card `Tạo chữ ă` and verified level-select layout.
  - Easy pass flow: tapping only markers reached `progress=3/3` before timeout (`mode: result`, `didPass=true` UI path).
  - Medium fail-by-life flow: tapping debris reduced hearts to 0 and triggered fail result.
  - Timeout fail flow: `window.advanceTime(40000)` produced `timeLeft=0` then fail result after celebration hold.
- Skill script check: `node .../web_game_playwright_client.js` cannot run in this env because package `playwright` is not installed; used Playwright MCP fallback for interactive validation.

---

Update (Reusable mini-game select/countdown + diacritic rules v2 + bubble feedback parity)

TODO
- [x] Tách màn chọn độ khó thành component dùng chung cho nhiều mini-game.
- [x] Tách countdown `3-2-1` thành component dùng chung, nhận hint/rule linh hoạt theo data.
- [x] Thêm countdown cho game tạo chữ trước khi vào gameplay.
- [x] Chuyển data 2 mini-game sang folder riêng `src/data/mini-games`, mỗi mini-game một file.
- [x] Cập nhật luật game tạo chữ:
  - Easy: `35s`, mục tiêu `10` chữ, tốc độ rơi chậm hơn.
  - Normal: `35s`, mục tiêu `15` chữ, 2 sao nếu không mất tim, 1 sao nếu mất >=1 tim.
  - Hard: `35s`, mục tiêu `20` chữ, 3/2/1 sao theo tim + thời gian còn lại.
- [x] Tinh chỉnh layout game tạo chữ:
  - HUD một hàng (`heart | Ă + progress | timer`).
  - Bỏ gờ hiển thị phía trên chữ `a` trong footer.
  - Sửa render ký tự `˘` (font fallback riêng cho dấu).
- [x] Sửa audio kết thúc game tạo chữ để tránh lặp:
  - phase hiệu ứng: dùng `success-answer`/`wrong-answer` ngắn.
  - màn result: vẫn để `LessonCompletionView` phát `applause`/`try-again`.
- [x] Thêm feedback khi tap sai bubble giống game tạo chữ (shake + flash đỏ + rung nhẹ, vẫn -1 tim).
- [x] Thêm hiệu ứng nổ nhẹ khi tap đúng bubble và vẫn hiện `+1`.
- [x] Run lint + typecheck + smoke test.

Notes
- Component mới:
  - `src/components/minigame/level-select-panel.tsx`
  - `src/components/minigame/shared-countdown.tsx`
- Data mini-game mới:
  - `src/data/mini-games/bubble-pop.ts`
  - `src/data/mini-games/diacritic-build.ts`
- `lesson-templates.ts` đã bỏ preset hardcode cũ cho 2 mini-game và gọi factory từ `src/data/mini-games/*`.
- Xóa file data cũ không còn dùng: `src/data/world-1-alphabet/bubble-star-rules.ts`.
- Mở rộng schema:
  - `ChallengePassStarRule` (dùng chung logic chấm sao theo tim/time).
  - `DiacriticBuildLevelConfig.passStarRules`.
  - `DiacriticBuildGameConfig.countdownHintText`.
- `tower-2/floor-4` set `countdownHintText: "ă"` để countdown hiển thị đúng theo yêu cầu data-driven.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Manual Playwright smoke:
  - Tower `ă` floor-4:
    - Select screen dùng component chung, hiển thị `10/15/20`.
    - Countdown xuất hiện trước game, hint hiển thị `ă`.
    - Easy pass: `targetCompletions=10` (đã pass).
    - Medium pass không mất tim: localStorage lưu `t2-f4-diacritic-build:normal = 2` sao.
    - Hard mở khóa sau khi pass Medium.
  - Bubble game (tower `a` floor-4):
    - Select screen + countdown dùng component chung.
    - Tap sai bubble: tim giảm, có damage feedback.
    - Tap đúng bubble: score tăng và popup `+1`, có burst effect.

---

Update (Refactor floor4 diacritic screen into folder + split interaction modes)

TODO
- [x] Move `floor4-diacritic-build-challenge.tsx` to folder-based screen: `src/screens/game-diacritic-build/index.tsx`.
- [x] Split interaction-mode specific logic/render into separate files:
  - `src/screens/game-diacritic-build/modes/tap-mode.tsx`
  - `src/screens/game-diacritic-build/modes/catcher-drag-mode.tsx`
- [x] Keep shared game flow in `index.tsx` (phase/timer/spawn/pass-fail/persist/common shell UI).
- [x] Add shared mode types in `src/screens/game-diacritic-build/types.ts`.
- [x] Update app import route to new folder index.
- [x] Remove old monolithic screen file.
- [x] Re-run typecheck/lint and smoke test.

Notes
- `index.tsx` now orchestrates shared flow only and delegates mode-specific pieces:
  - Frame resolution: `resolveTapFrame` vs `resolveCatcherDragFrame`.
  - Tutorial sequence: `startTapTutorialSequence` vs `startCatcherDragTutorialSequence`.
  - Tutorial hand render: `TapTutorialHand` vs `CatcherDragTutorialHand`.
  - Entity/footer render: `TapFallingEntity` + `TapFooter` vs `CatcherDragFallingEntity` + `CatcherDragFooter`.
  - Catcher-only controls/hitbox utilities live in `catcher-drag-mode.tsx`.
- `src/app/page.tsx` import switched to:
  - `@/screens/game-diacritic-build`

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint -- src/screens/game-diacritic-build/index.tsx src/screens/game-diacritic-build/types.ts src/screens/game-diacritic-build/modes/tap-mode.tsx src/screens/game-diacritic-build/modes/catcher-drag-mode.tsx src/app/page.tsx` pass.
- Playwright MCP smoke (`http://127.0.0.1:3100`):
  - Navigated to tower `ô` floor 4 (`Hứng Dấu`) successfully.
  - Level select shows expected easy/normal/hard cards after refactor.
  - Entered easy level and confirmed gameplay renders with catcher/footer.
  - `window.render_game_to_text()` returns valid payload with `interactionMode: "catcher_drag"`.
- Skill script check:
  - `node $WEB_GAME_CLIENT --help` still fails in this environment due missing `playwright` package (same known constraint).

---

Update (Hứng dấu polish + catcher hitbox/bounds + hard-only miss penalty)

TODO
- [x] Rename label/title from `Hứng Dấu` to `Hứng dấu` for tower 3 floor 4.
- [x] Improve catcher collision smoothness so fast-falling markers are still detected across frame steps.
- [x] Expand catcher drag bounds to reach full left/right edges.
- [x] Move catcher tutorial target to the `ô` side (not over `b`) and keep target clamped inside playfield.
- [x] Change miss-penalty rule:
  - Easy/Normal: missing correct item does **not** subtract score/progress.
  - Hard only: missing correct item subtracts score/progress.
  - Applied to diacritic game (`tap` and `catcher_drag`) and bubble game.

Notes
- Catcher mode changes:
  - Added swept collision sampling across movement step in `resolveCatcherDragFrame` to reduce tunneling misses on high speed.
  - Increased catcher hitbox with small padding so the whole `bô` catch area feels consistent.
  - `getCatcherHorizontalBounds` now allows `centerX` from `0` to `playfieldWidth` (full edge reach).
  - Footer slot (tone target) now uses explicit `toneTargetX` and is offset to the `ô` side.
- Tutorial targeting:
  - Added `CATCHER_TONE_TARGET_OFFSET_X` in shared index and used it for slot center fallback + tutorial marker path so tutorial marker aligns with tone target over `ô`.
- Miss penalty:
  - `src/screens/game-diacritic-build/modes/tap-mode.tsx` now reports `missedMarkerCount`.
  - `src/screens/game-diacritic-build/index.tsx` subtracts progress on missed marker only when `level.id === "hard"`.
  - `src/screens/floor4-bubble-challenge.tsx` subtracts score on missed target bubble only when `level.id === "hard"`.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint -- src/screens/game-diacritic-build/index.tsx src/screens/game-diacritic-build/modes/catcher-drag-mode.tsx src/screens/game-diacritic-build/modes/tap-mode.tsx src/screens/floor4-bubble-challenge.tsx src/data/world-1-alphabet/tower-3/floor-4.ts src/data/world-1-alphabet/tower-3/index.ts` pass.
- Playwright MCP checks:
  - Confirmed floor card + header text now `Hứng dấu`.
  - Confirmed catcher drag range reaches full edges (`centerX: 0` and `centerX: 360`).
  - Confirmed tap-mode easy run (`tower ă`, floor `Dấu kỳ diệu`) keeps progress after missed fall (`progressBefore: 1`, `progressAfter: 1`).
  - Confirmed catcher tone target DOM positioning (`slotLeft: 210px` when `catcherLeft: 180px`) indicating tutorial/flight target is shifted to `ô` side.

---

Update (HUD target fit + correct Vietnamese tone symbols + tutorial drop on `ô` side)

TODO
- [x] Fix gameplay HUD center capsule so `bố` text stays fully inside white background.
- [x] Replace distractor symbols with correct Vietnamese tones (`huyền`, `hỏi`, `ngã`, `nặng`).
- [x] Ensure catcher tutorial marker drop path targets the `ô` side (tone target), not `b`.

Notes
- HUD capsule adjustments in `/src/screens/game-diacritic-build/index.tsx`:
  - changed center capsule to `items-center`, increased vertical padding/min-height, reduced target font size slightly.
- Tone symbol set updated in `/src/data/world-1-alphabet/tower-3/floor-4.ts`:
  - `debrisSymbols: ["◌̀", "◌̉", "◌̃", "◌̣"]`
- Tutorial motion targeting in `/src/screens/game-diacritic-build/index.tsx`:
  - tutorial marker X now uses `catcherToneTargetX` directly in catcher mode and flies to that same target.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint -- src/screens/game-diacritic-build/index.tsx src/data/world-1-alphabet/tower-3/floor-4.ts` pass.
- Playwright MCP state check:
  - `render_game_to_text` now shows corrected symbols in active entities (`◌̀`, `◌̣`, `´` observed).

---

Update (Tower 5 Floor 4 memory flip challenge)

TODO
- [x] Add new mini-game type `memory_flip_challenge` to world map structure + game config exports.
- [x] Add reusable memory game data builder (`src/data/mini-games/memory-flip.ts`) with level presets, star-by-moves rules, token pools, and 3 hologram card-back options.
- [x] Add lesson template factory `createMemoryFlipChallengeLessons(...)`.
- [x] Switch tower 5 floor 4 from bubble game to memory game data (`m,e,b,ô`, `m,e,b,ô,c,a`, and hard adds `bố`,`mẹ`).
- [x] Implement screen `src/screens/floor4-memory-flip-challenge.tsx` with:
  - level select/countdown/playing/result phases
  - Fisher–Yates 4x4 deck shuffle
  - flip 2 cards per move; match clear; mismatch auto flip-back (600-900ms)
  - ignore double-tap same card
  - move-limit fail logic and per-level star scoring
  - easy tutorial flow + replay after fail streak rule
  - `window.render_game_to_text` and `window.advanceTime(ms)` hooks
- [x] Wire new screen in `src/app/page.tsx` route selection by `lessonKind`.
- [x] Fix select-screen stale stats after result (reset moves/pairs display back to 0).

Notes
- Memory level rules implemented per request:
  - easy: limit 25, pass gives 1 star
  - normal: limit 22, <14 moves => 2 stars, otherwise (<=21) => 1 star
  - hard: limit 20, <11 => 3 stars, 11-15 => 2 stars, 16-19 => 1 star
- Deck size is always 16 cards (8 pairs):
  - easy repeats 4 symbols evenly
  - normal uses 6 symbols and repeats to fill 8 pairs
  - hard uses 8 distinct pairs including words `bố`, `mẹ`
- Floor 4 title for tower 5 changed to `Trí nhớ`.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Skill-required Playwright client run attempted and blocked by missing dependency:
  - `node $WEB_GAME_CLIENT ...` => `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'`.
- MCP Playwright smoke checks performed on real UI flow:
  - enter world 1 -> tower 5 -> floor 4 memory game
  - mismatch path confirmed: board lock + auto flip-back delay works
  - same-card double tap ignored
  - fail when moves exceed limit (easy failed at move 26)
  - pass flow + unlock progression easy -> normal -> hard
  - hard deck contains `bố` and `mẹ`

Follow-up suggestions for next agent
- Add a deterministic UI test script for memory game level scoring thresholds (especially normal/hard 1-star vs 2/3-star boundaries).
- If needed, install local `playwright` dependency so `$WEB_GAME_CLIENT` can run directly without MCP fallback.

---

Update (Memory match-key bug + unified top HUD parity)

TODO
- [x] Fix memory matching logic so cards match by displayed text (normalized), not by preset pair id.
- [x] Remove in-game move-limit info block from memory screen UI (keep fail logic when moves exceed limit).
- [x] Add reusable mini-game top HUD component and apply to memory, bubble, and diacritic screens.
- [x] Use simple top header on level-select screens (back + game title + mascot only).
- [x] Remove `Trò chơi` caption from mini-game HUD center.
- [x] Normalize rules-audio button label to `Nghe luật chơi` on all mini-game level-select screens.
- [x] Re-run lint/typecheck and smoke-check all 3 mini-game screens.

Notes
- New shared component: `src/components/minigame/top-hud.tsx`
  - supports `mode: "simple" | "stats"` for select vs gameplay/countdown.
  - stats mode renders 3 blocks (left metric, centered game title, right metric).
- Memory screen changes (`src/screens/floor4-memory-flip-challenge.tsx`):
  - deck cards now include `matchKey` derived from normalized displayed text.
  - match resolution compares `firstCard.matchKey === secondCard.matchKey`.
  - tutorial demo pair selection now groups by `matchKey`.
  - removed in-body move-limit panel and hid move limit from gameplay HUD value (shows current moves only).
- Bubble and diacritic screens now also use `MiniGameTopHud` so top area is consistent.
- Rules button label is explicitly `Nghe luật chơi` in:
  - `src/screens/floor4-memory-flip-challenge.tsx`
  - `src/screens/floor4-bubble-challenge.tsx`
  - `src/screens/game-diacritic-build/index.tsx`

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Skill-required script still blocked in this environment:
  - `node $WEB_GAME_CLIENT --help` -> `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'`.
- Playwright MCP smoke checks:
  - Memory select header shows only back + `Trí nhớ` + mascot; rules button is `Nghe luật chơi`.
  - Memory gameplay header is 3-block (`Pairs`, centered title, `Moves`) and move-limit body block is removed.
  - Verified bug fix with repeated letters:
    - after selecting two `m` cards from different `pairKey` values (`m-7` and `m-3`), state reported `pairsCleared: 1` and both cards in `status: "cleared"`.
  - Bubble select/gameplay headers match the same top-HUD pattern; rules button text is `Nghe luật chơi`.
  - Diacritic select/gameplay headers match the same top-HUD pattern; rules button text is `Nghe luật chơi`.

---

Update (HUD simplification + heart placement + tap-to-unlock flow)

TODO
- [x] Simplify shared `top-hud`:
  - left/right show value only (no text labels),
  - center supports highlighted main letter/word (green, bold, larger),
  - simple mode title spacing adjusted to reduce clipping artifacts on select screen.
- [x] Bubble gameplay: remove top objective+heart block and move hearts into playfield top-left (same style as diacritic).
- [x] Keep hearts top-left for diacritic gameplay; align HUD style with simplified 3-slot format.
- [x] Update memory HUD right value to moves with unit (`lần`) and keep no labels.
- [x] Replace auto-unlock behavior with pending unlock state:
  - next level stays gray after pass,
  - lock icon becomes open lock,
  - center `Mở khóa` badge wiggles,
  - user taps level card to trigger unlock effect,
  - unlock no longer auto-starts countdown.
- [x] Re-run lint/typecheck and Playwright MCP smoke checks.

Notes
- Updated shared components:
  - `src/components/minigame/top-hud.tsx`
  - `src/components/minigame/level-select-panel.tsx`
- New level-card state:
  - `pendingUnlock?: boolean` (gray card + open lock + `Mở khóa` animated badge + `Chạm mở` chip).
  - Optional `onUnlockLevel(levelId)` flow added to select panel.
- Applied to screens:
  - `src/screens/game-memory-flip.tsx`
  - `src/screens/game-bubble-pop.tsx`
  - `src/screens/game-diacritic-build/index.tsx`

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Skill-required script still blocked:
  - `node $WEB_GAME_CLIENT --help` -> `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'`.
- Playwright MCP smoke checks:
  - Bubble countdown HUD shows `0/10 | c | 35s` (no `Điểm/Time` labels).
  - Bubble gameplay no longer has `Chạm vào bóng bay...` info block; hearts are shown on playfield top-left.
  - Diacritic countdown HUD shows simplified values + green center `ă`; no label text on left/right.
  - Memory HUD shows simplified values + right side `0 lần`; no `Pairs/Moves` labels.
  - Unlock flow verified on bubble game with cleared storage:
    - after passing easy, normal card became gray with `Chạm mở` + animated `Mở khóa`,
    - tapping normal card only unlocked card (kept `mode: select`, no auto-start countdown),
    - normal then showed regular `Chơi`; hard remained locked.

---

Update (Memory grid resize + new move-star thresholds)

TODO
- [x] Change memory easy/normal board to `3 x 4` (12 cards, 6 pairs).
- [x] Change memory hard board to `3 x 6` (18 cards, 9 pairs).
- [x] Update normal star rule: `<19 moves` => 2 stars, otherwise 1 star (within move limit).
- [x] Update hard rules:
  - move limit `35`
  - `<21` => 3 stars
  - `<26` => 2 stars
  - remaining valid moves => 1 star
- [x] Refactor memory screen to use per-level `pairTarget` and dynamic grid columns.

Notes
- Updated memory types in map structure:
  - `MemoryFlipLevelConfig` now includes `pairTarget` and `grid`.
  - `MemoryFlipGameConfig.grid` now accepts numeric rows/columns (not hardcoded `4x4` type).
- Updated memory presets (`src/data/mini-games/memory-flip.ts`):
  - easy: `pairTarget=6`, `grid=3x4`, `moveLimit=25`
  - normal: `pairTarget=6`, `grid=3x4`, `moveLimit=22`, 2-star threshold `<=18`
  - hard: `pairTarget=9`, `grid=3x6`, `moveLimit=35`, thresholds `<=20`, `21..25`, `26..35`
- Memory renderer now:
  - builds deck with pair target from current level
  - checks pass by current level pair target
  - renders board with dynamic `gridTemplateColumns`
  - shows per-level pair count in select subtitles and HUD denominator.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Playwright MCP smoke check (tower `e` floor 4):
  - easy state: `pairTarget=6`, `cards=12`, `moveLimit=25`
  - normal state: `pairTarget=6`, `cards=12`, `moveLimit=22`
  - hard state: `pairTarget=9`, `cards=18`, `moveLimit=35`
  - select subtitles show:
    - `Mức Dễ 6 cặp • tối đa 25 lượt`
    - `Mức Vừa 6 cặp • tối đa 22 lượt`
    - `Mức Khó 9 cặp • tối đa 35 lượt`

---

Update (Tower 4 floor 4: mini game "Bò ăn cỏ")

TODO
- [x] Add new floor-4 mini-game data model + lesson kind for cow-feed gameplay (separate from bubble game).
- [x] Switch tower-4/floor-4 to the new mini-game and rename floor title to `Bò ăn cỏ`.
- [x] Implement dedicated screen with requested loop:
  - 2 bushes/round (`cỏ` + distractor in `co|cò|có`)
  - correct/wrong/timeout outcomes with heart loss and auto next round
  - timeout reveal (flash correct bush before deducting life)
  - easy hint at `<=3s`
  - progress sentence `[Bò] [ăn] [cỏ]` (easy/normal: 1 hit each, hard: 2 hits each)
  - pass star mapping easy/normal/hard => 1/2/3 stars
  - sentence completion celebration (scale+glow + light confetti) then result
- [x] Add tutorial flow for easy (first play + replay after 2 easy fails), 6-8s demo with frozen interaction.
- [x] Add runtime hooks `window.render_game_to_text` and `window.advanceTime(ms)` for deterministic checks.
- [x] Re-run lint/typecheck and gameplay smoke checks.

Notes
- New types added in map schema:
  - `cow_grass_feed_challenge`
  - `CowGrassFeed*` config interfaces
  - `LessonContent.cowGrassFeedGame`
- New data builder:
  - `src/data/mini-games/cow-grass-feed.ts`
  - includes extensible knobs: sentence tokens, distractors, anti-repeat limits, tutorial settings, timing constants, per-level overrides.
- New lesson template factory:
  - `createCowGrassFeedChallengeLessons(...)` in `src/data/world-1-alphabet/lesson-templates.ts`.
- Tower 4 floor 4 now uses cow-feed config:
  - `src/data/world-1-alphabet/tower-4/floor-4.ts`
  - floor card label changed in `src/data/world-1-alphabet/tower-4/index.ts`.
- New screen:
  - `src/screens/game-cow-grass-feed.tsx`
  - route wired in `src/app/page.tsx`.
- Fixed during smoke pass:
  - countdown freeze bug (`3 -> 2` stuck) caused by missing `countdownValue` dependency in countdown effect.

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Skill-required Playwright client still blocked by environment dependency:
  - `node $WEB_GAME_CLIENT --help` -> `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'`.
- Playwright MCP smoke checks on `http://127.0.0.1:3100`:
  - tower `o` floor card shows `Bò ăn cỏ`.
  - easy first-run tutorial appears, then countdown and gameplay starts.
  - timeout flow deducts exactly 1 life and advances to next round.
  - easy pass reaches result with `progressHits: [1,1,1]`.
  - normal unlock flow is tap-to-unlock (no auto-start after unlock tap).
  - hard pass reaches result with `progressHits: [2,2,2]` and success summary.
  - anti-repeat sampling (normal, multiple sessions) shows max streak `2` for both distractor and correct-side.

Follow-up suggestion for next agent
- Optional polish: if needed, expose a tiny debug payload for countdown/tutorial timers in `render_game_to_text` to make automated assertions even stricter.

---

Update (Cow grass feed UX pass + shared rules modal)

TODO
- [x] Move rules UI to a shared modal component and switch all mini-game level screens to the same `Xem luật chơi` action.
- [x] Remove close `X` from rules modal and close by tapping outside only.
- [x] Restyle rules modal and set title `Luật chơi` to Mali font.
- [x] Fix cow-game countdown flow so tutorial reliably starts after `3,2,1` (no StrictMode side-effect race).
- [x] Tutorial visual cleanup: no extra helper text, dark overlay + spotlight emphasis on cow + correct bush + hand tap.
- [x] Redraw grass bushes with more natural layered mound/blades look.
- [x] Redraw `BofSvg` to balance eye backgrounds and add mood variants (`idle/open/chew/sad`).
- [x] Remove extra blank visual area under cow icon and drive feedback via mouth/face animations.
- [x] Correct tap behavior: mouth opens then chew loop (~1.5s total).
- [x] Wrong tap behavior: sad face lasts ~1s.
- [x] Update sentence/progress text to lowercase `bò ăn cỏ`.
- [x] Difficulty hit targets: easy/normal `6` hits, hard `9` hits.
- [x] Redesign progress bar (dim incomplete words, glow/ping on completed words) and place it lower under playfield.
- [x] Ensure progress bar only renders in gameplay/tutorial/celebration screen, not level select.

Notes
- New shared component:
  - `src/components/minigame/rules-modal.tsx`
- Level select default rules CTA now unified:
  - `src/components/minigame/level-select-panel.tsx` (`rulesActionLabel = "Xem luật chơi"`)
- All mini-games now open the shared rules modal on select screen:
  - `src/screens/game-bubble-pop.tsx`
  - `src/screens/game-diacritic-build/index.tsx`
  - `src/screens/game-memory-flip.tsx`
  - `src/screens/game-cow-grass-feed.tsx`
- Cow config changes (`src/data/mini-games/cow-grass-feed.ts`):
  - sentence tokens -> `bò ăn cỏ`
  - easy/normal required hits per word: `2` (total `6`)
  - hard required hits per word: `3` (total `9`)
  - `correctResolveMs` -> `1600`
  - `wrongResolveMs` -> `1080`
  - `cowChewMs` -> `1200`
  - `cowSadMs` -> `1000`
- Cow screen fixes (`src/screens/game-cow-grass-feed.tsx`):
  - fixed countdown effect to avoid side-effects inside state updater
  - added deterministic cow mood telemetry in `render_game_to_text`
  - cleared stale tutorial runtime when entering gameplay
  - corrected tutorial highlight logic for correct bush.
- `BofSvg` now accepts optional `mood` prop and preserves default rendering for floor-selection usage:
  - `src/screens/floor-selection/components/bof-svg.tsx`
- Cleanup fix from prior partial edit:
  - removed leftover `setShowRulesHint(false)` reference in `src/screens/game-memory-flip.tsx`.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint` pass.
- Playwright MCP checks on `http://127.0.0.1:3100`:
  - level-select shows `Xem luật chơi`; modal opens and closes by outside tap.
  - cow level cards show updated targets: easy/normal `6 lượt`, hard `9 lượt`.
  - runtime state confirms countdown -> tutorial transition (with tutorial pending true before start).
  - runtime state confirms correct flow: `open` -> `chew` -> `idle`.
  - runtime state confirms wrong flow: `sad` persists around 1s before returning idle.

---

Update (Rules modal alignment + cow HUD/progress refinements)

TODO
- [x] Rules modal header layout: move `Mini game` badge to same row, right side of `Luật chơi`.
- [x] Remove helper text `Chạm ra ngoài để đóng` from modal body.
- [x] Keep level-select layout shared via common panel; adjust cow select HUD to use shared simple top HUD like other mini games.
- [x] Cow gameplay: move progress block to top under HUD with spacing.
- [x] Cow gameplay: remove duplicate top `bò ăn cỏ` heading and keep phrase below progress boxes.
- [x] Cow gameplay: replace HUD center game name with progress value (`x/y`).
- [x] Increase grass-choice text contrast with white badge + stronger shadow.
- [x] Progress segment boxes tuned to avoid clipping tall letters (padding/size/line-height consistency).

Notes
- Updated files:
  - `src/components/minigame/rules-modal.tsx`
  - `src/screens/game-cow-grass-feed.tsx`
- Also normalized several invalid Tailwind utility remnants in cow screen (`h-38`, `z-70`, `rotate-16deg`, etc.) to bracket syntax so styles apply correctly.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint` pass.
- Playwright MCP visual pass could not be rerun in this round due persistent Chrome profile lock/permission issue (`named_platform_channel_mac ... Permission denied`, `database is locked`).

---

Update (Follow-up polish: minigame barrel + cow gameplay pacing/layout)

TODO
- [x] Add shared minigame barrel export (`src/components/minigame/index.ts`) and switch mini game screen imports to it.
- [x] Align cow level-select spacing with other mini games (select content no longer hugs header).
- [x] Increase sentence-finish hold duration so center phrase stays visible longer.
- [x] Remove redundant bottom `bò ăn cỏ` text under progress bar.
- [x] On wrong/timeout, keep correct answer highlighted and delay next round about `1.5s`.
- [x] Compact progress bar: vertical bite dots on right and lower text baseline to avoid clipping.
- [x] Add visible gap between progress bar block and gameplay playfield.

Notes
- Import cleanup using barrel:
  - `src/components/minigame/index.ts`
  - updated screens: bubble, memory, diacritic, cow.
- Cow pacing defaults updated in `src/data/mini-games/cow-grass-feed.ts`:
  - `wrongResolveMs: 1500`
  - `timeoutResolveMs: 1500`
  - `sentenceCelebrateMs: 1300`
- Cow resolution logic updated so wrong answer state also enables `correctFlashVisible`, and timeout no longer clears flash before round transition.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint` pass.

---

Update (Requested follow-up: reusable feed-game UI + timing/audio)

TODO
- [x] Add minigame barrel index and switch mini game imports to reduce import noise.
- [x] Increase sentence celebration hold time a bit longer.
- [x] Refactor cow-feed screen into folder module and extract feed-specific UI into `ui/` with `index.tsx` export.
- [x] Make mascot/food visuals data-driven (`animalIconId`, `foodVisualId`) for future reusable animal-feed variants.
- [x] Move progress sentence source to config data (`progressSentence`) and use it as primary sentence text source.
- [x] Compact progress bar visuals and tune dot proportions/alignment.
- [x] Increase wrong/timeout round delay to 2.5s while keeping correct answer highlight visible.
- [x] Migrate all old pop SFX paths to new common asset path.
- [x] Add grass-eating audio during chew phase.

Notes
- Cow feed module moved to folder:
  - from `src/screens/game-cow-grass-feed.tsx`
  - to `src/screens/game-cow-grass-feed/index.tsx`
- New reusable feed UI components:
  - `src/screens/game-cow-grass-feed/ui/animal-icon.tsx`
  - `src/screens/game-cow-grass-feed/ui/food-visual.tsx`
  - `src/screens/game-cow-grass-feed/ui/progress-bar.tsx`
  - `src/screens/game-cow-grass-feed/ui/index.tsx`
- New config fields in data schema:
  - `animalIconId`, `foodVisualId`, `progressSentence` in `CowGrassFeedGameConfig`.
- Default cow-feed timing/audio updates:
  - `wrongResolveMs = 2500`
  - `timeoutResolveMs = 2500`
  - `sentenceCelebrateMs = 1800`
  - chew phase uses `/assets/audio/game/cow-grass-feed/eating-grass.mp3`.
- Pop SFX path updates to `/assets/audio/game/common/pop.mp3` in:
  - bubble
  - diacritic
  - cow-feed.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint` pass.
- Asset existence check pass:
  - `public/assets/audio/game/common/pop.mp3`
  - `public/assets/audio/game/cow-grass-feed/eating-grass.mp3`

---

Update (Animal feed naming generalization + floor-4 explicit config)

TODO
- [x] Rename minigame naming from cow-specific to generic animal feed across screen/data/type layers.
- [x] Rename lesson kind from `cow_grass_feed_challenge` to `animal_feed_challenge` and wire in app routing.
- [x] Rename mini-game data builder file to `src/data/mini-games/animal-feed.ts` and update imports.
- [x] Keep floor-4 specific reusable fields explicitly declared in data (`animalIconId`, `foodVisualId`, `progressSentence`).
- [x] Move game audio folder from `public/assets/audio/game/cow-grass-feed` to `public/assets/audio/game/animal-feed` and update runtime path.
- [x] Re-run lint + typecheck.

Notes
- Generic types/config names are now `AnimalFeed*` and lesson payload property is `animalFeedGame`.
- `floor-4.ts` explicitly sets:
  - `animalIconId: "bof"`
  - `foodVisualId: "grass-bush"`
  - `progressSentence: "bò ăn cỏ"`
- Validation:
  - `pnpm exec tsc --noEmit` pass
  - `pnpm lint` pass

---

Update (Boss tower unlock fix + review data + mystery game placeholder)

TODO
- [x] Fix boss tower tap/unlock behavior so boss can be entered when unlock condition is met (and no longer blocked by stale `canBossUnlock` mismatch).
- [x] Add dedicated `tower-boss` data with 2 internal floors:
  - review floor (10 active lessons)
  - mystery floor (memory mini-game placeholder).
- [x] Implement boss entry flow to skip floor-selection and go straight into lesson flow.
- [x] Add gating rule for mystery game: unlock when review floor reaches at least `5/10` stars.
- [x] Add placeholder image assets for review word-image quiz options.
- [x] Keep unlock/testing logic independent from persistent tower unlock storage (boss unlock now accepts all regular towers unlocked).
- [x] Re-run lint/typecheck and smoke test boss flows.

Notes
- New boss data files:
  - `src/data/world-1-alphabet/tower-boss/index.ts`
  - `src/data/world-1-alphabet/tower-boss/floor-1.ts`
  - `src/data/world-1-alphabet/tower-boss/floor-2.ts`
- Boss tower in map structure now has internal floors and starts `unlocked: false` with runtime unlock condition.
- Boss review floor (`floor-1`) currently contains 10 active lessons:
  - 2x letter listen+choose
  - 2x vocab listen+choose image
  - 2x letter listen+repeat (speech threshold 60%)
  - 1x vocab listen+repeat (speech threshold 60%)
  - 2x letter trace (threshold 60%)
  - 1x vocab trace (threshold 60%)
- `LessonInterface` now hides the large preview card for active image-answer quizzes so the answer is not revealed before selecting an image.
- Boss auto-routing is handled in `src/app/page.tsx`:
  - first entry -> review floor
  - after review stars >= 5 -> auto route to mystery game floor.
- Added placeholder vocabulary image cards under:
  - `public/assets/images/review/*.svg`

Validation
- `pnpm lint` pass.
- `pnpm exec tsc --noEmit` pass.
- Skill-loop check attempted:
  - `node $WEB_GAME_CLIENT --help` -> blocked in this environment (`ERR_MODULE_NOT_FOUND: playwright`).
- Playwright MCP smoke checks on running app (`http://127.0.0.1:3100`):
  - world-1 tower map shows boss progress `5/5`, boss tap enters lesson flow directly.
  - boss review starts at step `1/10` (no floor-selection screen).
  - step `3/10` (vocab image quiz) shows image choices and no answer-revealing preview card.
  - when `1:6:1` floor stars are set to `5` in local storage, tapping boss routes directly to mystery memory mini-game (`Boss`).

Assumption recorded
- User-provided numbering had one duplicate (`l6`) and an over-specified trace section for a 10-lesson cap. Current implementation keeps total at 10 lessons while preserving all requested activity types and the 5/10 unlock gate.

---

Update (Refactor lesson templates: split lesson vs game data)

TODO
- [x] Tách `lesson-templates` monolith thành nhiều file theo từng lesson type.
- [x] Tách riêng lớp `game data templates` cho các challenge game (`bubble-pop`, `animal-feed`, `memory-flip`, `diacritic-build`).
- [x] Giữ nguyên API factory hiện tại để các file `floor-*` chỉ cần truyền biến riêng như cũ.
- [x] Chạy kiểm tra lint + typecheck sau refactor.

Notes
- Xóa file cũ: `src/data/world-1-alphabet/lesson-templates.ts`.
- Thêm thư mục mới:
  - `src/data/world-1-alphabet/lesson-templates/`
    - `letter-floor-lessons.ts`
    - `vocab-floor-lessons.ts`
    - `bubble-pop-challenge-lessons.ts`
    - `animal-feed-challenge-lessons.ts`
    - `memory-flip-challenge-lessons.ts`
    - `diacritic-build-challenge-lessons.ts`
    - `index.ts` (barrel export)
  - `src/data/world-1-alphabet/game-data-templates/`
    - `bubble-pop.ts`
    - `animal-feed.ts`
    - `memory-flip.ts`
    - `diacritic-build.ts`
    - `index.ts`
- Sau refactor:
  - Layer `lesson-templates/*` chỉ tạo `LessonContent` (id/type/kind/scoring/title/instruction) và gắn payload game.
  - Layer `game-data-templates/*` chỉ xử lý phần config data game trước khi trả về `*GameConfig`.

Validation
- `pnpm lint -- src/data/world-1-alphabet/lesson-templates src/data/world-1-alphabet/game-data-templates src/data/world-1-alphabet/tower-1/floor-1.ts` pass.
- `pnpm exec tsc --noEmit` pass.

---

Update (Global lesson templates by lesson-kind + floor migration)

TODO
- [x] Move lesson templates to global scope at `src/data/lesson-templates` for cross-world reuse.
- [x] Split letter lessons into separate files by lesson-kind (listen, quiz, trace-demo, trace-practice).
- [x] Split vocab lessons into separate files by lesson-kind (listen-look, pronunciation_practice, word-build, trace-practice).
- [x] Keep mini-game config logic in existing `src/data/mini-games/*`; challenge lesson templates now call mini-game factories directly.
- [x] Migrate world-1 floor files to call lesson templates per lesson item (no grouped letter/vocab factory file).
- [x] Remove legacy monolithic file `src/data/world-1-alphabet/lesson-templates.ts`.
- [x] Run lint + typecheck.

Notes
- New shared template structure:
  - `src/data/lesson-templates/letter/*`
  - `src/data/lesson-templates/vocab/*`
  - `src/data/lesson-templates/challenges/*`
  - `src/data/lesson-templates/index.ts`
- Each floor now composes `LessonContent[]` by explicitly calling each lesson template function, and customizes only floor-specific variables.
- Challenge lesson templates (`bubble`, `animal-feed`, `memory-flip`, `diacritic`) separate lesson metadata from game data by:
  - taking `lessonId` at lesson layer
  - forwarding remaining game input directly to `create*GameConfig` in `src/data/mini-games/*`.

Validation
- `pnpm lint -- src/data/lesson-templates src/data/world-1-alphabet/tower-1 src/data/world-1-alphabet/tower-2 src/data/world-1-alphabet/tower-3 src/data/world-1-alphabet/tower-4 src/data/world-1-alphabet/tower-5 src/data/world-1-alphabet/tower-boss-1` pass.
- `pnpm exec tsc --noEmit` pass.

---

Update (Boss tower review refactor + shared intro randomization)

TODO
- [x] Convert letter/vocab learning intros to shared per-kind intro pools (`3` variants each) and randomize per lesson entry.
- [x] Add lesson metadata to support boss exceptions: `disableIntro`, `fogMode`, and new lesson kinds for boss review.
- [x] Rebuild boss floor-1 lesson data to match requested 10-lesson flow (quiz/image-quiz/pronunciation-practice/tracing pass-fail).
- [x] Replace boss quiz fog erase with locked overlay style (no erase interaction).
- [x] Change boss pass threshold to `6/10` and update unlock copy.
- [x] Add boss-specific completion mode: pass-count summary + optional `Game Bí Ẩn` CTA when passed.

Notes
- Shared intro data is now assigned via `introVoiceOptions` (e.g. `listen-1..3`, `quiz-1..3`) and consumed at runtime by `useLessonAudio`, which randomly picks one option whenever a lesson is entered.
- Boss floor-1 now uses:
  - L1-2: `letter_quiz` + `fogMode: "locked"`
  - L3-4: `vocab_image_quiz` (audio prompt + 3 image answers from `/assets/images/words/*.webp`)
  - L5-7: `pronunciation_practice` (look-and-repeat, no speaker audio)
  - L8-10: tracing pass/fail with `>= 70%` pass and `maxStars: 1`
- Boss completion keeps celebration audio behavior but hides star rows, displays only pass count, and shows `Game Bí Ẩn` button when pass count reaches threshold.

Validation
- `pnpm lint` ✅
- `pnpm exec tsc --noEmit` ✅
- Playwright MCP smoke checks ✅
  - Boss lesson 1 shows locked fog overlay (`Lớp khóa che chữ cái`), no erase behavior exposed.
  - Boss lesson 3 renders image-answer quiz with title `Nghe và chọn đúng ảnh từ vựng` and word images.
  - Boss lesson 5 renders look-repeat letter mode with mic CTA and no speaker button.
  - Network logs confirm shared intro loading for regular lessons (`/assets/audio/intro-letters/listen-*.mp3`) and no intro playback on boss lesson flow.

Blocked
- Could not run `$WEB_GAME_CLIENT` script from skill because local `playwright` package is missing and install is blocked by offline registry access (`ENOTFOUND registry.npmjs.org`).

---

Update (Boss tower re-entry shows choice screen after pass)

TODO
- [x] Fix boss tower entry flow so re-entering boss does not auto-jump into mystery game.
- [x] Show `boss-review-choice` immediately when boss review floor was already passed before.
- [x] Keep normal behavior for users who have not passed review yet (enter review lesson directly).
- [x] Validate with typecheck and interactive smoke checks.

Notes
- `src/app/page.tsx`
  - Replaced boss auto-entry resolver with `resolveBossEntryFloorId` that always routes boss entry to floor review (`floorId=1`) instead of auto-selecting mystery game floor.
  - Simplified boss `handleLessonComplete` behavior to return to tower selection instead of auto-switching floor based on stored stars.
- `src/screens/lesson-interface/index.tsx`
  - Added initial boss-review gate: when opening boss review floor, if stored floor stars already meet pass threshold (`>=6`), show `BossReviewChoiceView` immediately.
  - Fixed stored-star read for boss floor by passing `floorMaxStars` into `getStoredFloorProgress(...)` (default cap is 3 otherwise, which incorrectly truncates boss stars).
  - Pre-fill `score` with stored pass count so choice header shows meaningful progress.

Validation
- `pnpm exec tsc --noEmit` pass.
- Skill Playwright client attempt:
  - `node "$WEB_GAME_CLIENT" ...` failed in this env due missing `playwright` package import for the skill script.
- Playwright MCP smoke:
  - With mocked progress `1:6:1.stars=6`: entering boss shows `Chọn Hành Trình Tiếp Theo`; review lesson title is not shown.
  - With empty progress: entering boss shows review lesson (`Nghe và chọn chữ cái đã học`), choice screen not shown.

---

Update (Boss lesson image answers + boss choice redesign)

TODO
- [x] Fix boss floor review lesson 3-4 so 3 image choices are always visible on mobile.
- [x] Keep answer image source mapped from `images/words/*.webp` using word asset keys (`awn`, `cas`, etc.) and random selection logic.
- [x] Redesign `boss-review-choice-view` to feel more mysterious and balanced on mobile.
- [x] Revalidate by typecheck/lint + Playwright smoke snapshots.

Notes
- `src/screens/lesson-interface/renderers/active-renderer.tsx`
  - Fixed image-answer card ratio from invalid `aspect-3/4` to `aspect-[3/4]` so image cards no longer collapse.
  - Tuned image quiz grid width/gap for mobile (`max-w-md`, tighter spacing).
  - Added image card background + inner padding for clearer full-image visibility.
  - Added bottom text badge on each image card to help readability/selection.
- `src/data/world-1-alphabet/tower-boss-1/floor-1.ts`
  - Normalized boss word image path generation with helper `buildWordImagePath(assetKey)`.
  - Kept random selection behavior while guaranteeing source comes from `/assets/images/words/<assetKey>.webp`.
- `src/components/completion/boss-review-choice-view.tsx`
  - Reworked visual direction to a mysterious/cosmic theme with layered gradients, star pattern, glowing accents, and mobile-first spacing.
  - Upgraded both action cards (`Ôn tập`, `Game Bí Ẩn`) with clearer hierarchy and stronger contrast.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint` pass.
- Playwright snapshots:
  - Boss review step `3/10` shows image quiz with 3 visible image options (`bố`, `cỏ`, `cá`).
  - Boss re-entry choice screen displays redesigned header + both action cards correctly on mobile viewport (`390x844`).

---

Update (Boss image visibility + colorful choice header + audio gate)

TODO
- [x] Force boss lesson 3-4 image options to remain visible on mobile.
- [x] Redesign `boss-review-choice-view` to be colorful, keep mysterious feel, and add a back button/header pattern like tower screens.
- [x] Prevent lesson-1 audio from auto-playing while on `boss-review-choice`; only play after choosing `Ôn tập`.
- [x] Revalidate with typecheck, lint, and Playwright smoke snapshots.

Notes
- `src/screens/lesson-interface/renderers/active-renderer.tsx`
  - Switched image-answer card layout from ratio-only sizing to fixed mobile-safe heights (`h-40`, `md:h-52`) to avoid collapsed cards.
  - Switched answer image rendering to direct `<img>` in this renderer for immediate paint reliability in boss image quiz cards.
- `src/components/completion/boss-review-choice-view.tsx`
  - Added `onBack` prop and implemented top sticky header pattern aligned with tower screens (back button + title + mascot).
  - Updated visual design to colorful gradients (green/orange/blue/pink accents) while keeping starry mystery styling.
- `src/screens/lesson-interface/hooks/use-lesson-audio.ts`
  - Added `autoPlayEnabled` option to gate auto-intro/main playback and hard-stop audio when disabled.
- `src/screens/lesson-interface/index.tsx`
  - Added boss-entry resolution state so boss review choice can render without triggering lesson audio first.
  - Passed `autoPlayEnabled` to `useLessonAudio`: disabled while boss choice screen is shown.
  - Passed `onBack={handleBack}` to `BossReviewChoiceView`.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint` pass (2 warnings from `@next/next/no-img-element` in active-renderer due intentional `<img>` reliability switch).
- Playwright smoke:
  - Boss step `3/10` snapshot shows 3 visible image choices (`cá`, `mẹ`, `cỏ`) with images rendered.
  - Boss choice snapshot on passed progress shows tower-style header with back button and colorful two-card layout.
  - Resource check before choosing `Ôn tập` reports no `/assets/audio/*` loads from lesson autoplay; after choosing `Ôn tập`, lesson audio loads normally.

Addendum
- Added inline eslint waivers for two intentional `<img>` usages in boss image answer cards, so `pnpm lint` now passes cleanly without warnings.

---

Update (Follow-up hardening for boss image strip + guaranteed active celebration audio)

TODO
- [x] Harden boss image quiz rendering so lesson 3-4 never falls back to tiny/incorrect strip layout.
- [x] Guarantee celebration audio trigger for every active lesson scoring event (success/fail), independent from overlay mount timing.
- [x] Re-run lint/typecheck and re-verify boss 3/10 image cards via Playwright.

Notes
- `src/screens/lesson-interface/renderers/active-renderer.tsx`
  - Added deterministic vocab image mode: if `lessonKind === "vocab_image_quiz"`, always render image-card grid.
  - Added fallback text->image resolver for boss words:
    - `cá->cas.webp`, `ăn->awn.webp`, `bố->boos.webp`, `bò->bof.webp`, `mẹ->mej.webp`, `cỏ->cor.webp`.
  - Kept fixed card heights (`h-40`, `md:h-52`) to avoid card collapse on mobile.
- `src/screens/lesson-interface/hooks/use-lesson-flow.ts`
  - Injected `playCelebrationFeedback(correct)` into scoring flow and call it right after stopping lesson audio, before advance timer.
- `src/screens/lesson-interface/index.tsx`
  - Use `playOneShotAudio(...)` for celebration feedback in scoring path (success/fail).
  - Set `muteSound` on visual celebration overlays to prevent race/double-trigger with scoring-path audio.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint` pass.
- Playwright (mobile viewport 390x844) on fresh boss run:
  - Step `3/10` shows 3 image answer cards with labels and images (`cỏ`, `bố`, `cá`).

---

Update (User-requested cleanup: no UI hardcode, full-bleed image cards, replay button, boss audio delay)

TODO
- [x] Remove UI-level hardcoded word->image map and move image derivation to data via `wordAssetKey`.
- [x] Make lesson 3-4 image cards full-bleed (no vocab text label under cards).
- [x] Add replay speaker button for vocab image quiz lessons (boss lesson 3-4).
- [x] Delay boss lesson autoplay audio by 1000ms.

Notes
- Added central data helper: `src/data/word-assets.ts` with `buildWordImagePath(wordAssetKey)`.
- Extended data contracts:
  - `LessonAnswer.wordAssetKey?: string`
  - `VocabImageQuizChoice.assetKey: string`
- `createVocabImageQuizLesson(...)` now writes `wordAssetKey` into each answer, so UI can resolve image source from data (`answer.image` or `buildWordImagePath(answer.wordAssetKey)`) without hardcoded text mapping.
- Updated boss review word data to use shared helper from data module.
- `LessonActiveRenderer` updates:
  - image card uses `object-cover` full-bleed
  - removed vocab text overlay under images
  - added `Nghe lại từ vựng` button in image-quiz mode (`lessonKind === vocab_image_quiz`) using existing `playAudio(...)` callback.
- `useLessonAudio` now supports `autoPlayDelayMs`; `LessonInterface` passes `1000ms` for boss tower lessons.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint` pass.
- Playwright snapshot at boss step `3/10`: shows 3 full image buttons (`cỏ`, `cá`, `bố`) and visible replay speaker button.

Addendum
- Replaced deprecated `MutableRefObject` usage in lesson flow hook with `RefObject`.
- Consolidated `buildWordImagePath(wordAssetKey)` usage into `src/data/lesson-templates/vocab/shared.ts`; removed any usage/import from standalone word-assets module.
- Re-exported `buildWordImagePath` from vocab index for consistent data-layer imports.

Addendum
- Enforced rule: `buildWordImagePath` is now called only inside `src/data/lesson-templates/vocab/create-vocab-image-quiz-lesson.ts`.
- Removed UI/data direct calls elsewhere; boss floor data now passes only `assetKey`, and image path resolution happens in the vocab image quiz template.

---

Update (Boss tower unlock visuals + star-flight smoothing)

TODO
- [x] Remove redundant boss stars (left-side + interior decorative star).
- [x] Show boss unlock progress badge only while the boss tower is still locked.
- [x] Rework unlock star-flight animation to be smoother and target the real boss tower node.
- [x] Fix boss target lookup by anchoring on the real boss button/target element (not `div.contents`).
- [x] Re-validate lint/typecheck and runtime animation behavior.

Notes
- Added `id="boss-tower"` to the actual boss button and a dedicated `id="boss-tower-target"` anchor for precise flight destination.
- Flying stars now animate with curved keyframes (`start -> mid -> end`) using per-star duration and easing for smoother movement.
- Added animation cleanup via `onComplete` to remove finished flying stars.
- Flash/navigation timing is now derived from the latest-arriving star instead of a fixed timeout.
- Removed decorative boss stars requested by UI feedback.

Validation
- `pnpm exec eslint src/screens/tower-map.tsx` pass.
- `pnpm exec tsc --noEmit` pass.
- Playwright runtime probe (boss unlock click): sampled flying-star center moved from `avgY ~90` to `avgY ~595` with `maxY ~717` before cleanup, confirming stars descend from header area to boss-tower region.
- Visual screenshot check confirms the left-side boss star is removed and the `5/5` unlock badge is still shown while boss remains locked.

Addendum (Boss-star visibility + final landing)
- Kept stars visible until final segment (`opacity` now fades only at tail end), so they no longer appear to disappear near tower connections.
- Added 4-point trajectory (`start -> mid -> late -> end`) with late-stage drop directly onto boss target.
- Tightened end-point random offset so stars converge on boss gate area.
- Increased visual salience: larger star size (`w-10 h-10`) + animated glow halo.
- Playwright probe after patch:
  - At `t=520ms`: star cluster near boss (`avgY=659`, `maxY=701`) while target is around `y=703`.
  - At `t=700ms`: remaining star around boss (`avgY=683`) before final fade.

Addendum (Boss unlock star-motion jitter + clarity pass)
- Removed per-star completion state updates during flight to avoid mid-animation re-render jitter.
- Simplified flight path back to 3-point arc and switched x/y/rotate tween to linear interpolation for smoother continuous motion.
- Tuned spread/offset: fewer stars (8), tighter endpoint randomization, smaller midpoint drift for stable convergence into boss gate.
- Replaced blurry animated halo with crisp star rendering: dark stroke + warm fill + static glow ring, so stars remain visually obvious while still highlighted.
- Validation probe: at `t=700ms`, flying stars center near boss target (`avgY=703`) matching target region (`y≈703`) without early disappearance.

---

Update (World 1 paging unification + page-nav button-only)

TODO
- [x] Remove pseudo world IDs (`101`, `102`) from `game-config` and keep page 1/2/3 data under world 1.
- [x] Keep one shared `towerConnections` for all world-1 pages.
- [x] Update app flow to fetch world data by `(worldId=1, world1BookPage)` instead of remapped world IDs.
- [x] Convert tower-map pagination controls to icon-only buttons (no visible text labels).
- [x] Re-validate typecheck/lint and run interaction smoke checks.

Notes
- `src/data/game-config.ts`
  - Removed `WORLD1_BOOK_PAGE_WORLD_ID_MAP`, `getWorld1BookPageWorldId`, and `getWorld1BookPageByDataWorldId`.
  - Added `GetWorldDataOptions` with `world1BookPage` and a `world1BookPageDataMap` to keep page-1/2/3 grouped under world-1.
  - `getWorldData(worldId, { world1BookPage })` now resolves world-1 pages without creating extra world IDs.
  - `getWorldTheme(worldId, world1BookPage)` now resolves theme directly from page for world-1.
- `src/app/page.tsx`
  - Removed `resolveDataWorldId` mapping logic.
  - Updated tower/floor/lesson lookups to call `getWorldData(selectedWorldId, { world1BookPage })`.
  - Kept runtime `worldId` as real world ID (`1` for world-1) across screens.
  - Included `selectedWorldPage` in `LessonInterface` key to avoid stale instance reuse between world-1 pages.
- `src/screens/tower-map/index.tsx`
  - Data/theme now resolved via `worldId + currentPage`.
  - Page-flip key now includes page (`${worldId}-${world1BookPage}`) so transitions still animate after removing `101/102`.
  - Previous/next controls now icon-only buttons with `aria-label` for accessibility (`Trang trước`, `Trang sau`) and no visible text spans.
- `src/screens/floor-selection/index.tsx`
  - Added optional `world1BookPage` prop and passed it to `getWorldData/getWorldTheme`.

Validation
- `pnpm exec tsc --noEmit` pass.
- `pnpm lint` pass.
- Skill Playwright client command failed due missing runtime package:
  - `Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'playwright'` from `$HOME/.codex/skills/develop-web-game/scripts/web_game_playwright_client.js`.
- Playwright MCP smoke test (fallback) on local dev server:
  - Navigated `welcome -> world map -> world-1 tower map`.
  - Verified page switching `1 -> 2 -> 3` still works with unified world-1 data path.
  - Verified nav controls are icon-only in DOM (empty `textContent`, no label spans) while keeping `aria-label` for accessibility.
  - Console error check returned no browser errors.
