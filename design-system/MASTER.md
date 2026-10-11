# FJuan — UI evolution

## Identity to preserve

FJuan is a motorsport data publication, with a cockpit underneath. Keep the original SVG logos, the warm ink canvas (#140605), maroon (#740A03), racing red (#C3110C), ember (#E6501B), warm paper (#F5E9E4), and each team's authentic livery colors. Retain Russo One for display, Rajdhani for interface text and JetBrains Mono for timings. Keep square panels, coded navigation, red lower-thirds, circuit maps, the five-light 3D wordmark and real car models.

## Design decisions

Derived from an application and browser audit, with UI UX Pro Max design-system, Next.js and chart searches. Its generic replacement fonts, palettes and conversion patterns are overridden by the existing identity.

- Editorial hierarchy: generous mastheads, tight display tracking, short descriptions, a clear control rail. Use readable tint for title accents; racing red remains the action and rule color.
- Surfaces: solid warm panels for data, translucent material only for navigation and overlays. Quiet the carbon weave and reserve textures for meaningful graphics.
- Layout: one 1200px content width and responsive gutters. Champion panels receive stronger number typography; circuit pages feel like a track atlas; telemetry reads like an instrument deck.
- Data: tabular timing values, explicit units, quiet horizontal grids, contrasting line patterns, accessible labels and summaries. Values always come from existing integrations; no invented results.
- Motion: existing lights-out introduction retains its delight budget. Page transitions use a 250ms opacity/transform entrance; repeated data interactions stay immediate. Hover effects are restricted to precise pointing devices. Honor reduced motion in CSS and JavaScript.
- Mobile: minimum 44px primary targets, scrollable control strips, safe-area padding, stable hero viewport units, 16px input text, no page overflow. Text and zoom remain available.
- Accessibility: visible keyboard focus, semantic headings, text as well as colors for status, keyboard navigation and focus restoration in overlays.

## Avoid

Replacement branding, generic SaaS cards, decorative chart animation, blur on every panel, random gradients, placeholder data, motion that blocks controls, and unbounded 3D effects.

## Validation

Desktop 1440px, tablet 768px and 1024px, phone 375px; route and interaction checks through Playwright, reduced-motion checks, lint, typecheck and production build. Browser emulation cannot certify hardware touch behavior.

## Analytics experience refinement

See AUDIT.md for the route and workflow audit. Use task-based entry points for newcomers, complete classifications with visible filters, a clear local page index on long profiles, and context next to unfamiliar metrics. Keep summary views compact and make all raw values reachable through native disclosure and named scroll regions. Use Fields.tsx for visible search/select labels and 44px controls; use InsightNote for definitions. Empty, failed, and pending data are separate states with recovery actions. Page-specific loading shapes must match the content. Stream expensive ancillary data instead of blocking the shell.
