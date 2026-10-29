# Race prediction: correctness and evaluation

FJuan combines eight factors with the existing weights: recent form 35%, qualifying 15%, championship 15%, circuit history 10%, weather 10%, sprint 7%, tyre fit 5%, grid penalties 3%. **No weights or temperature were tuned in this change.** Predictions and card explanations run entirely from this deterministic model. No AI service is called to generate a forecast.

## Prediction horizons and cutoff

- **Pre-qualifying:** strictly before main qualifying starts. Before practice participants are available, the most recent available completed race in the same season supplies an explicitly provisional field. Recent qualifying form is allowed; this weekend's qualifying result and starting grid are forbidden.
- **Post-qualifying / pre-race:** after main qualifying ends and a completed qualifying result is published, strictly before the scheduled race start. Current qualifying order is used. A scheduled end alone does not establish that a delayed session has finished.
- Qualifying in progress and predictions newly reconstructed after race start are unsupported. Previously saved snapshots remain usable.

Every input response is recorded with its source and observation time (`availableAt`). A capture's cutoff is the time the last inputs were collected. The validator rejects a capture crossing a horizon boundary, future observations, unfinished sessions, target/future results in history, and target/future standings. Only information actually collected before the cutoff can enter the snapshot. The scorer has no network calls, clock dependency, or randomness.

The shared calendar keeps the race visible until three hours after its start. The forecasting cutoff still closes at lights out. All timestamps have explicit time zones. Forecasts use the race-start hour in UTC and the circuit coordinates supplied by the race calendar, including `villeneuve` for Montreal; no `(0, 0)` fallback is used.

## Why old archive entries can be unavailable

Unversioned historical endpoints return what is known **today**. Filtering by event date does not prove when a qualifying revision, penalty, grid, or result was published. FJuan therefore does not manufacture historical snapshots from those responses. The archive evaluates saved pre-race snapshots and explicitly excludes races without them.

Live prediction inputs use `cache: no-store`; prediction and classification API responses also disable caching. Saved JSON snapshots are immutable and selected by season, round, horizon, and optional cutoff. No present-day API result is used to patch a missing field during replay. Within one server render, the page and assistant share a capture.

Historical weather requires a forecast captured before the cutoff. The supported alternative is **weather-neutral evaluation**, with that feature fixed at 50 and missing coverage reported. Actual race weather, reanalysis, and today's forecast are not substitutes. Open-Meteo's [historical forecast product](https://open-meteo.com/en/docs/historical-forecast-api) stitches the first hours of successive forecasts; it is not automatically an archived forecast issued at the chosen cutoff. Integrating verified individual runs would require a separate availability audit.

## Entries, identifiers, and missing inputs

Post-qualifying captures use race-specific qualifying participants. Pre-qualifying captures use the latest completed practice session's participants when available. Before practice, they use the most recent available completed race field from the same season and disclose that substitutions or withdrawals may change it. These are explicitly provisional: a practice reserve, a non-qualifier later admitted, or an unreported withdrawal can make the inferred field incomplete. An explicit race-withdrawal message removes that driver. A supplied timestamped entry-list snapshot can represent a more authoritative field. Without either weekend participants or a previous race field, capture fails; it never falls back to a season-wide driver union. This preserves field provenance while allowing the model to run before practice starts.

Canonical driver IDs and legacy aliases live in `ratings.ts`, following [Jolpica driver identifiers](https://github.com/jolpica/jolpica-f1/blob/main/docs/endpoints/drivers.md). Unmapped session participants retain an `openf1:<number>` identifier and neutral history rather than receiving an invented Jolpica identity. Their coverage must be resolved before full-field evaluation.

Debutants remain eligible. Missing form, qualifying, standings, circuit data, ratings, forecasts, or penalty information receives a neutral 50/100 and is disclosed per driver. Missing observations do not set normalization bounds. An opener may use the previous season's explicitly bounded results/standings; no current-season unrestricted standings endpoint is used.

Wet-weather and tyre ratings are inherited **subjective heuristics**, first versioned at `2026-10-27T20:03:52Z`. They are unavailable before that timestamp. They are not learned parameters or evidence of historical data availability. Wet ratings and penalty severity use fixed scales so field size cannot erase a signal. Tyre compound assumptions are not asserted to be actual event allocations.

## Grid penalties

Only explicit grid decisions in race-control messages observed before the cutoff count. Investigations, generic engine changes, sprint penalties and no-further-action notices do not. Actual session car numbers are used, including a champion running number 1 instead of their permanent number. Penalties retain a severity from 0 to 10 and score `100 − 10 × severity`; unknown coverage is neutral, not a clean-grid claim.

Qualifying features use raw session order, **never starting-grid order**. The latter is a separate benchmark, avoiding a second deduction for penalties already in that grid. Duplicate messages use the maximum reported severity; explicit rescissions clear the recorded penalty. Multiple distinct cumulative decisions and ambiguous wording still require richer structured decision data. [OpenF1 documents](https://openf1.org/docs/#starting-grid) that starting grids appear after official results are published; an undated historical grid is never treated as available earlier.

## Estimates and explanations

`modelEstimate` is a finite, nonnegative, full-field softmax share from 0 to 1; shares sum to 1 before display rounding. It is computed before any display truncation. Max subtraction prevents overflow. The former misleading `podiumProbability` field has been removed from internal consumers and API output.

The UI labels shares **Model estimate**, not calibrated win probabilities. Unknown weather is shown as unavailable, and per-driver factor fallbacks and the capture horizon are visible. Provider/model branding is absent from prediction labels, tooltips and errors. Existing provider endpoints, technical configuration and attribution remain intact; explanations are not represented as human-written.

Card insights are assembled deterministically from the model's factor scores and missing-input statements. They require no provider key or AI request. Chat receives the cutoff, full field, missing factors, coverage and uncertainty, with explicit rules against inventing supporting evidence. As with any open-ended generated conversation, those instructions are not a guarantee of factuality; card insights have the stricter statement-selection boundary.

## Outcome and metric policy

- DNF: include the official finishing order. No blame or mechanical reliability judgment is inferred from the status.
- DNS/DNQ/withdrawal: omit from rank comparison. If present in the forecast field, retain their estimate as a non-winning outcome and count a top-three pick as a miss.
- DSQ: tied after all other starters for rank comparison; never a winner/podium hit.
- Missing predicted starters or missing outcomes: report identifiers and withhold aggregate metrics for that race. Do not silently score a reduced field.
- Spearman: align driver IDs, average-rank ties on each side, then compute Pearson correlation of those ranks. Fewer than three paired drivers or a constant ordering returns unavailable, never a clamped value.
- Position MAE: compare average ranks on that same aligned starter set. The per-driver table also shows the raw displayed position difference.
- Top-three and top-ten hits: fractional expected membership when predicted scores tie. A tied leader is not counted as an unambiguous winner call.
- Brier: multiclass sum of squared error across the entire eligible forecast field. Log loss: negative log of the actual winner's estimate. A zero estimate produces an explicitly counted infinite loss, not an arbitrary clipped probability.
- Calibration: ten equal-width full-field reliability bins, counts and expected calibration error. These diagnostics do not turn relative shares into calibrated probabilities. Outcomes within a race are dependent.

## Reproducible capture and evaluation

Node 22.18+ and the project's installed dependencies suffice; no extra test or evaluation dependency is installed.

```sh
npm run test:prediction
npm run prediction:capture -- --out /absolute/path/to/snapshots --season 2026 --round 21 --horizon pre-qualifying
npm run prediction:evaluate -- --manifest /absolute/path/to/manifest.json --out report.json
```

The capture command only runs while the requested horizon is open. Set `PREDICTION_SNAPSHOT_DIR` to a durable existing directory to archive server captures and enable the history UI. It is opt-in because a serverless deployment's temporary filesystem is not a durable archive. No cloud store was provisioned. Avoid using public web directories for files that may later contain private entry information.

The evaluator's manifest format is:

```json
{
  "schemaVersion": 1,
  "trainThrough": "2025-06-30",
  "validationThrough": "2025-09-30",
  "races": [{
    "season": "2025", "round": "1", "date": "2025-03-16",
    "snapshots": {
      "pre-qualifying": "snapshots/pre.json",
      "post-qualifying": "snapshots/post.json"
    },
    "outcome": "outcomes/2025-1.json"
  }]
}
```

Paths are relative to the manifest. Outcome files contain `season`, `round`, `date`, and `rows` of `{driverId, position, status}` using the status values above. `parseOutcomes` converts official Jolpica classifications. An empty `snapshots` object explicitly records an excluded race. Select the latest valid capture for each horizon using a rule fixed before viewing outcomes; freeze the manifest before evaluation.

The output includes hashes of every file actually read, exact cutoffs and lead times, sample sizes, coverage, exclusions, per-horizon ranking/proper scoring metrics, reliability bins, and paired comparisons on identical race sets. The corrected fixed-weight model is compared with championship, recent-form, qualifying-order and starting-grid baselines where full-field inputs exist. Baseline distributions use the same temperature; none are claimed calibrated.

Training-period summaries do not perform any fitting. Validation uses strictly later races. The final holdout is reserved and its snapshot/outcome files are not opened by default. `--holdout` is a separate final evaluation operation for a frozen model; never tune or select snapshots based on that result. Input hashes identify evaluation bytes, not proof against a fabricated source timestamp. Archive provenance must be trusted and independently retained.

## Validation evidence from this change

All eight reported categories were reproduced before edits with mocked inputs (ten distinct failure cases). The new regression suite covers the corrected paths, cutoff rejection, entry fallback behavior, metric edge cases, deterministic card explanations, immutable snapshots and chronological holdout isolation.

Validation completed locally: 59 prediction regression/evaluation tests and the existing telemetry assertions passed; lint completed with 0 errors and 13 existing warnings outside the changed prediction code; typecheck and the production build passed. Chromium checks at 390px and 1440px verified the full 22-driver synthetic field, unavailable-weather labels, horizon/cutoff display, neutral branding, and no horizontal overflow. The archive was checked with missing snapshots and incomplete outcomes. API checks returned 400 for invalid inputs and 422 for unavailable historical snapshots. Browser fixtures were explicitly synthetic; live provider-generated responses were not exercised.

A live read of the 2025 calendar returned 24 races. The coverage inventory reserved 11 training-period races, 6 validation races and 7 untouched holdout races. There were **zero saved pre-race input snapshots**: all 34 training/validation race-horizon cases were excluded and no historical accuracy metrics were produced. Holdout input/outcome files were not read. Network access worked; missing historical snapshots, not network access, blocked a valid predictive-accuracy comparison.

Correctness improvements are demonstrated by deterministic tests. Predictive-accuracy improvements are **not established**. No tuning is justified by this inventory, and synthetic fixtures are never presented as race-performance evidence.

## Pre-practice availability correction

The previous entry gate returned HTTP 422 before practice, preventing the model from running despite available prior-race inputs. The live capture now uses an explicitly provisional previous-race field until weekend participant data appears. The scoring weights and factor calculations are unchanged. Tests cover this exact pre-practice path through the prediction API, and historical replay asserts zero network requests even with an AI provider key present. AI calls have been removed from forecast generation; optional conversational chat remains independent.
