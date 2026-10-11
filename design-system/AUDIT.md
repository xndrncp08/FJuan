# Analytics experience audit

Audited all 17 page families and their intercepted detail windows on the current main branch before implementation. Reviewed shared controls, loading/error states, navigation, standings, search, comparison, driver/team profiles, race/circuit/car details, session telemetry, 3D playback and prediction review. Browser baseline: desktop route sweep and screenshots of home, driver profile, race results and search.

## Preserve

Original logo, warm ink/maroon/red/ember palette, Russo One / Rajdhani / JetBrains Mono, square broadcast panels, numbered navigation, circuit maps, livery colors, lights-out introduction, original 3D car and track scenes, intercepted route windows, and existing integrations.

## Findings and response

- New visitors see powerful tools but few explanations of what to do: provide four task-based entry points and contextual links.
- Comparison promises historical careers but only lists the current grid: share the daily driver index and provide a keyboard-searchable picker.
- Search silently caps results and has a sparse initial view: expose full counts, categories, examples and incremental results. Keep query/type in the URL.
- Driver classification omits the podium from its main list: show a complete filterable classification while preserving the lead panels.
- Driver season history is capped at 30 and hides fields on phones: give it a metric view and an explicitly expandable, scrollable full table.
- Current team IDs missing from local historical metadata can fail to open: use live constructor metadata for current profiles.
- Calendar requires scrolling through completed rounds: provide upcoming/completed filters and a link to the next round. Upcoming rounds need weekend information.
- Race tables hide useful information on small screens and rely on color: provide disclosure of full detail, result filtering, captions and explicit labels.
- Session driver request failures can leave endless skeletons; partial telemetry failures look like absent data: distinguish loading, empty and failed states and offer retries.
- Dense model review metrics have unexplained abbreviations and hover-only inspection: explain definitions and add keyboard lap selection.
- Page skeletons repeat generic rounded panels: use route-specific shapes and preserve square geometry.
- Root layout waits for a prediction on every page: stream the assistant separately from navigation and page content.

## Design rules added

Task-first wayfinding, visible labels on filters, 44px controls, concise result announcements, native disclosures for definitions and detail, full data access on mobile through named scroll regions, immediate data updates, and purposeful motion only. Dark-only is the existing product theme; no new light-mode variant or replacement identity.
