# Analytics experience validation

Validated October 11, 2026 against the production build, with Playwright in Chrome. Audit and design rules are in AUDIT.md and MASTER.md.

## Build and source checks

- `npm ci`: installed the unchanged lockfile.
- `npm run lint`: passes with 16 existing warnings and no errors (baseline: 17 warnings).
- `npm run typecheck`: passes.
- `npm run build`: passes; production server starts and serves the application.
- `git diff --check`: passes.
- No standalone test script is defined in this repository. Interaction checks use the Playwright CLI without adding dependencies to the application.
- Existing API routes, upstream endpoints, model calculations, data assets, branding assets and dependency versions are preserved.

## Responsive and visual coverage

- Reviewed all 17 page families before implementation, then swept primary and detail routes at 375px, 768px, 1024px and 1440px. Primary routes return HTTP 200. No document or desktop-navigation overflow; no page exceptions in the route sweeps.
- Pages: home, driver standings, team standings, circuits, calendar, comparison, archive search, predictions, live sessions, 3D telemetry, prediction delta, driver profile, team profile, car detail, circuit detail, race weekend and not-found state.
- Additional loaded-data checks cover the live dashboard, complete career table, historical comparison, full prediction report and 3D scenes. Fixed an overflow exposed only after live timing data loaded: at 375px the document remains 375px wide and the 570px timing table scrolls within its 341px region.
- Compared phone and desktop screenshots of home, standings, driver profile and race weekend; inspected loaded mobile live, delta and telemetry views. Original GLB car renders when its stage enters the viewport.

## Accessibility

- Axe WCAG 2 A/AA and WCAG 2.1 AA scans cover all 17 page families. Corrected driver-number contrast, viewer focus semantics and the comparison listbox; affected pages pass on recheck.
- Loaded live dashboard, full delta report, telemetry and open comparison picker pass their scans with zero violations. Fixed the full delta classification scroll region so keyboard users can scroll it.
- Visible focus and 44px primary controls; labeled search/select inputs; radiogroups use roving focus and arrow keys. Tables have captions and named scroll regions.
- Search traps focus and Escape returns it to the Search button. Circuit detail window closes with Escape, restores its originating link and releases scrolling. Mobile navigation closes and releases scroll locking when resized to desktop.
- Reduced-motion home renders with no page exceptions or overflow. Original reduced-motion behavior remains in the wordmark, counters, transitions and 3D scenes.

## Functional checks

- Historical comparison: real Ayrton Senna and Lewis Hamilton careers load; searchable selection works with the keyboard; Points and Rates charts switch; Swap updates both selections and the shareable URL.
- Driver standings: Russell filter returns 1 of 23 drivers. Historical calendar season 2025 survives hydration; Upcoming shows a completed-season recovery action.
- Team and circuit filters: Audi returns 1 of 11 teams; Italy returns the real current-calendar Monza record. Current Audi profile opens even without local historical metadata.
- Driver profile: Hamilton metric/order selection updates bars; full record exposes all 20 seasons and all eight columns on a phone.
- Search: British query reports full counts, Drivers category persists in the URL, and Show more expands the initial preview.
- Race: Qualifying and All columns expose Q1/Q2/Q3; Norris filter returns one result; UTC switches the displayed zone. Completed Australian GP includes all five scheduled sessions, sourced from the existing calendar API.
- Live: real 2025 Monza and Russell lap data load. Fastest-first racing filter places lap 45, 1:21.800, first and shows 52 timed racing laps. Driver selection collapses to a summary and transfers focus to Change Driver. Partial upstream failure is explained and can be retried without losing selection. A deliberately aborted driver request produces a recovery state; restoring the real service and retrying loads the grid.
- Delta: native Inspect a lap selects lap 26 and updates exact values; Split layout works. Full race classification remains reachable and scrollable by keyboard.
- Telemetry: real 3D scene renders; playback advances the timeline and pauses; keyboard scrubbing changes the timeline. Simulated data switches to the original offline engine with an explicit SYNTHETIC source and circuit label.

## Performance and limitations

Home data and the prediction assistant stream independently of the shell. Query caching and cancellation prevent stale live-driver updates. Plot changes remain immediate; original 3D offscreen pausing and pixel-ratio limits are retained. No new runtime dependencies or image/model assets were introduced.

Phone and tablet checks use browser emulation, not physical devices. Automated scans are complemented by keyboard and visual checks; they do not certify every assistive technology. Jolpica and OpenF1 intermittently rate-limit requests; recovery states were checked and successful real-data loads verified. Missing insight credentials use the application's existing fallback. Three.js emits existing deprecation warnings.

Screenshots and browser logs are archived outside the source tree in `/private/tmp/fjuan-analytics-audit`. The earlier evolution evidence remains in `/private/tmp/fjuan-ui-audit`.
