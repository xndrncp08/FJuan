# App reliability fixes

Calendar and standings requests now distinguish upstream failures from successful empty seasons, and their season-specific query state owns loading and retries. Countdown clocks preserve the server placeholder during hydration. Navigation and search reset without effect-driven state cascades; charts and the mutable Three.js camera ref no longer trigger lint warnings.

Driver comparison fetches career statistics through `/api/drivers/[id]/stats`, avoiding browser CORS failures and sharing server caches. Career pagination rejects incomplete responses, includes all fastest-lap pages, and populates season poles and average qualifying positions. Short HTTP 429 cooldowns receive one bounded retry. Longer provider limits remain explicit failures.

The title archive covers completed championships through 2025, with 35 champions and 76 titles. Names were checked against the [official F1 Hall of Fame](https://www.formula1.com/en/drivers/hall-of-fame), the 2025 title against [the FIA report](https://www.fia.com/news/f1-norris-crowned-fia-formula-one-world-champion-verstappen-takes-abu-dhabi-win), and changed driver IDs against Jolpica season standings. The static archive must be updated when another championship finishes.

Prediction refresh makes one initial request and displays subsequent fetching state. Clearing chat is disabled during a response. API regressions cover malformed chat bodies, empty cutoffs, incomplete race selections, invalid telemetry parameters, and provider-independent valid streaming.

## Local verification

- Zero-error, zero-warning lint; TypeScript and production build pass.
- `npm test` runs the API, prediction, and telemetry-query regressions plus the existing telemetry self-check. CI runs this suite and rejects lint warnings.
- Browser checks cover calendar failure/retry and season persistence, driver filters, mobile menu/search reset, and the main routes at 390px. Driver comparison was also checked against the server endpoint. No horizontal overflow was found in the checked routes.
- A live provider returned an HTTP 200 chat stream using explicitly synthetic prediction input. This checks connectivity, not predictive accuracy or factual reliability of arbitrary replies.
- Production HTTP checks cover malformed inputs and synthetic telemetry/delta success responses. External data services can still rate-limit requests; the UI preserves recovery rather than publishing partial career totals.

Historical prediction replay still requires genuine saved pre-race snapshots. See [prediction model and evaluation](prediction-model.md); these fixes do not establish improved prediction accuracy.
