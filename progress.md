Original prompt: 1. ngôi sao đang chưa ở giữa khung hiệu ứng phía sau, chỉnh lại 1 chút cho nằm chính giữa khung hiệu ứng (cho cả 2 Th: 1 sao và 2 sao) 2. số sao ở cuối floor chưa đúng: hiện tại chưa nhận số sao của lesson 4 -> fix lại 3. mascot ở cuối khi xong floor chưa nằm giữa màn hình theo chiều ngang -> căn giữa 4. số sao ở tower hiển thị ở tower map tối đa là 4 sao: tương ứng với 4 floor, khi user thu thập đủ hết tối đa sao của 1 floor -> sẽ nhận đc 1 sao ở tower

## Implemented
- Centered lesson celebration stars inside the effect frame:
  - Added center translation to earned star wrappers (`-translate-x-1/2 -translate-y-1/2`) so 1-star and 2-star layouts stay centered on the aura.
- Fixed missing lesson 4 stars in end-of-floor summary:
  - Kept `lessonStarsThisAttempt` in a ref and used the latest ref value when finishing floor to avoid stale closure data in delayed `handleNext`.
  - Persisted floor progress with this latest lesson-star map.
  - Updated trace practice canvas disable condition to depend on `traceResult` only, so lesson 4 writing remains interactive and can be scored.
- Centered completion mascot horizontally:
  - Added `className="mx-auto"` to completion mascot.
- Implemented tower star model (max 4 per tower):
  - Added `hydrateTowersWithStoredProgress` to compute tower stars from floor progress:
    - each floor contributes 1 tower star only when floor stars reached that floor’s max stars.
    - tower `maxStars` becomes number of floors (4 for current towers).
  - Switched tower map to use hydrated tower progress from localStorage.

## Validation
- `pnpm lint`: pass.
- `pnpm exec tsc --noEmit`: pass.
- Runtime checks with Playwright MCP:
  - 1-star celebration: centered (`deltaX = 0`).
  - 2-star celebration: centered as a pair around viewport center (`meanDelta ~= -5` during animation frame).
  - Completed floor with forced strong lesson 4 trace score:
    - summary: `Bạn đã làm đúng 2/2 câu và nhận 3/3 sao!`
    - stored progress: `lessonStars.t1-f1-l4 = 2`, `stars = 3`.
  - Tower map after full floor 1:
    - tower `A-C` displays `4` star slots with `1` filled star.
    - total tower counter shows `1`.

## Notes
- Existing audio asset 404/not-supported logs are still present and outside this scope.
