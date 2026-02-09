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
