# AI Assistant Project Instructions

These instructions guide AI coding agents contributing to this repository. Focus on precision: follow existing patterns and naming; prefer extending helpers over ad‑hoc logic.

## Overview / Architecture
- Monorepo style: root is Vite + React TypeScript frontend (`src/`), backend Firebase Cloud Functions live in `functions/` (TypeScript compiled to `functions/lib`).
- Data domain: sports schedules, team metadata, power / matchup metrics, broadcast provider + channel info, image assets.
- Firestore structure implied (not all code shown): `sports/{league}.teams` documents hold team objects keyed by teamId with nested `info`, `colors`, `metrics` (see `initializeTeams` in `functions/src/index.ts`). Additional collections: `broadcasting/espnNetworks`, `users/*`.
- Scheduled + on‑demand updates: `scheduledUpdater.ts` orchestrates fetching & storing fresh schedule + metrics (invoked hourly via `scheduledGamesUpdate`). Ad‑hoc HTTP triggers (e.g. `requestGamesUpdate`, `requestImgUpdate`).
- Scrapers under `functions/src/sports-scrapers/` fetch external HTML/JSON/CSV (ESPN, MoneyPuck, etc.) and normalize into internal metric maps.
- Token + Email utilities: daily email scheduler builds per‑user share links via JWT -> Firebase custom token flow (see `generateDashboardTokenForUser`, `signInWithJWT`). Secrets: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `JWT_SECRET`.

## Core Data Patterns
- Types (see `functions/src/types.ts`): Always key maps by ID or metric name. Helper generics rely on simple `Record<string, any>` shapes.
- Team metrics shape: `{ [teamId]: { metrics: { powerIndexes?: {...}, matchupQualities?: {...} }, groups?: {...}, info?: {...}, colors?: {...} } }`.
- Combine small maps with `combine_maps([...])` instead of manual object spreading; convert parallel arrays to objects with `mappify(keys, values)`.
- Parsing scrapers: Each sport config in `scrape_game_metrics.ts` maps metric names to URL builders and parser functions. To add a new metric, extend CONFIG: add URL function under `team` or `game`, then add a parser implementation returning a `TeamMetric` or `GamesMetric` using helpers.

## Scraper Conventions
- Fetch raw text via `scrapeUrl` (returns string). Do not re‑implement HTTP logic.
- For HTML table parsing use `cheerio`. For embedded JSON prefer targeted substring / regex extraction (see `parseNFLPowerIndex`, `parseMLBPowerIndex`, `parseNHLPowerIndex`). Keep external site structure assumptions minimal & log (with `logger.error`) rather than throw if a single team fails.
- Convert numeric strings to numbers except composite record strings like `0-0-0`.
- When team abbreviations differ, add manual mapping (see NHL parser manualMappings) before logging an error.

## Updating / Merging Metrics
- Use `updateMetrics` to iterate configured metrics; each parser merges into a cumulative `Metrics` object keyed by metricName. `updateTeamMetrics` flattens per-metric outputs into a single per‑team aggregate (merging nested objects shallowly per key).
- Adding fields: ensure new nested objects merge cleanly (avoid arrays unless necessary) or adjust `updateTeamMetrics` merging logic.

## Firebase Functions
- Always set CORS: HTTP triggers use `{ cors: true }`. Return early with 400 on missing required query params.
- Use Firestore merge writes when initializing data (`teamsRef.set(..., { merge: true })`).
- Respect emulator vs production base URL logic (`isEmulator` flag) when generating links.

## Auth & JWT Flow
- Owner vs guest links: owners keep full preferences; guests get cloned preferences sans `notificationEmails`. Guest users suffixed with `:Guest` may be created automatically.
- JWT signing: issuer `slates-dashboard`, audience `slates-users`; never hardcode secrets— rely on injected env `JWT_SECRET`.

## Environment / Tooling
- Node 22 runtime for functions (see `functions/package.json`). Use ESM (`"type": "module"`). Import compiled JS paths with `.js` extension from TS sources in functions code (Firebase deploy compiles TS -> `lib`).
- Frontend uses Vite scripts (`dev`, `build`) and Tailwind (`index.css`, `tailwind.config.js`). Not deeply documented here; keep component additions idiomatic React 18 + TS.
- Run emulators: root `npm run emulators` (all), or functions only via `cd functions && npm run serve` (compiles then starts). Persist state with `emulators:persist` script.
- Deploy: `npm run deploy:functions` or `npm run deploy:hosting` or combined `npm run deploy` from root.

## Implementation Guidelines for AI
- Prefer extending existing helpers over new utilities (e.g., use `combine_maps`, `mappify`). If a helper is missing, check similar patterns before adding.
- Maintain parser symmetry: keep naming `parse<Sport><Metric>` and export only via CONFIG maps.
- Log recoverable data issues; throw only when aborting entire operation (e.g., network / parsing root failure).
- Keep Firestore writes batched or minimal per function invocation (current pattern: single set with merged map). Follow that style.
- When adding external deps, update the appropriate `package.json` (`functions` vs root) and consider cold start impact.

## Example: Adding New Team Power Metric
1. Identify source URL & response format.
2. Add URL builder in `CONFIG.sports.<sport>.team` (returns full URL string).
3. Implement parser: fetch raw via existing mechanism; parse into `{ [teamId]: { metrics: { powerIndexes: { <stat>: value } } } }`.
4. Ensure numeric conversions; map abbreviations to team IDs using `sportsTeams.json` or API if needed.
5. Deploy and verify with emulator logs.

## Style / Lint
- ESLint configs at project root and in `functions/`. Follow existing import order and no unused vars (suppress with inline disable only when justified).

Provide concise PR descriptions: what metric or function added, data source assumptions, failure logging strategy.

---
Feedback welcome: update this doc if you add new sports, metrics, or change merging logic.
