# UI evolution validation

Validated October 11, 2026 against the production build, with Playwright in Chrome.

## Build checks

- `npm run lint`: passes with 17 existing warnings and no errors.
- `npm run typecheck`: passes.
- `npm run build`: passes; production home responds with HTTP 200.
- No standalone test script is defined in this repository.

## Browser coverage

- Phone (375px): home, drivers, teams, circuits, calendar, compare, predictions, live, 3D telemetry, prediction delta and search. All respond with HTTP 200 and no document overflow.
- Tablet (768px, 1024px) and desktop (1440px): all ten primary pages. No document or desktop navigation overflow, and no page errors in the route sweep.
- Comparison: real career data loads; Points and Rates tabs work, keyboard navigation works, the second series uses a dashed trace, and the expandable data table displays 40 rows.
- Live: real Monza session and Russell lap data load; full-session scale and keyboard lap-window controls work.
- Navigation: search and mobile menu trap keyboard focus; Escape restores focus and scrolling. Resizing to desktop closes the mobile menu and releases scroll locking.
- 3D: original car model renders after its stage enters the viewport; telemetry playback advances the timeline and pauses correctly.
- Reduced motion: production home renders without hydration errors; the ignition ring is hidden, and count-up motion is skipped.

## Limits

Phone and tablet checks use browser emulation, not physical devices. OpenF1 returned a rate-limit response during one live-data request; the existing error handling remains available. Telemetry also retains its existing, explicitly labeled offline engine. Missing insight credentials use the application's existing fallback. Three.js reports existing deprecation warnings.

Screenshots and browser logs are kept outside the source tree in `/private/tmp/fjuan-ui-audit`.
