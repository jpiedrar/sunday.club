# Sunday Club

A phone-first NFL pick’em app with the complete official 2026 schedule, configurable light and dark themes, all 32 team logos, required favorite-team profiles, private leagues, one-tap picks that toggle off before kickoff, sportsbook-implied win chances, league pick percentages, server-enforced kickoff locks, automatic NFL results, weekly/monthly/season standings, a dedicated league-picks tab, and commissioner controls. Each game’s picks become visible to the league at kickoff. Published selections backed by 20% or less of the league are labeled as wild picks in the table. Privacy-aware standings badges identify the league member with the most public wild picks and the member with the most picks against their favorite team for the selected week, month, or season; tied leaders share the badge. Weekly member progress is visible to the full league while anyone remains incomplete. Commissioners can publish a snapshot containing only matchups for which every league member has submitted a pick. When every member completes the full week, the progress panel disappears and all weekly picks become public automatically.

## Run locally

Requires Node 22.13+ and npm. Install dependencies with `npm ci`, run `npm run db:local`, then `npm run dev`. Open the printed local URL and choose **Account → Sign in with ChatGPT**. The Sites development adapter creates a local Seedy account without an external login. Create a league, then return to Picks. Each selected week is populated from the verified official 2026 NFL schedule bundled with the app.

Run `npm test` for isolated database rule checks. With the local server running, `npm run test:api` verifies the API and creates a local verification league. `npx tsc --noEmit` checks types; `npm run build` produces the Worker and browser assets.

## Stack and boundaries

TypeScript, React, Tailwind 4, Vinext (Next.js-compatible App Router), D1 SQL, and Sites-managed ChatGPT sign-in. This is a working self-contained alternative to the requested preferred Supabase stack; Supabase email/password login and Postgres are not integrated. No external NFL API key is needed. Week 1 market chances are calculated from DraftKings moneylines, with the sportsbook margin removed. The server refreshes them from the ESPN scoreboard feed and uses the latest verified snapshot if that feed is unavailable.

- `app/pick-app.tsx`: mobile interface and account/league/standings views.
- `app/api/club/route.ts`: authenticated API; per-request membership and commissioner checks.
- `db/schema.ts`, `drizzle/`: schema and migration.
- `db/store.ts`: D1 access and idempotent fallback-data seeding.
- `lib/games.ts`: Week 1 and temporary offline fallback data.
- `lib/odds.ts`: live moneyline lookup, fair-probability calculation, and Week 1 fallback values.
- `lib/results.ts`: automatic final-result synchronization from the NFL scoreboard feed. Previously saved commissioner results remain as a fallback until the live feed supplies an authoritative final.
- `lib/schedule.ts`, `schedule-2026.json`: official Weeks 2–18 population with stable provider IDs and UTC kickoffs.
- `public/manifest.webmanifest`, `sw.js`: installable PWA shell and offline notice. Authenticated pages/data are never cached. Offline pick writes are not queued.

League creation and membership are atomic. Picks are unique per league/player/game. A conditional SQL write checks database UTC time, membership, game status and the selected team at mutation time. Refreshing or altering the phone clock cannot bypass locks. Ties, cancellations, wrong picks and missing picks score zero; tied points share rank. Commissioners cannot remove themselves. Removing a member deletes their league picks; rotate the invite code to prevent rejoining.

## Private deployment

The Sites manifest declares D1. Hosting applies committed migrations before publishing. Authentication headers must come from the trusted Sites dispatcher; do not expose the raw Worker to untrusted callers. The initial deployment is owner-only. Site access must be shared with friends before they can use league invitations. Commissioner and league membership checks remain in effect after site sharing.

## Next integration: Supabase and live NFL data

Replace the identity helper with verified Supabase sessions, map profile IDs, translate the schema to Postgres, and enable RLS for memberships and picks. Enforce locks in a Postgres function/trigger using database time. Keep service-role keys server-side. Retain transactional league creation. This requires a Supabase project and its settings.

All 18 weeks use the official schedule. Weeks 2–18 populate from a verified provider snapshot when opened, retaining stable provider IDs and UTC kickoff times. The first replacement of an old placeholder week clears picks made against those fictional matchups. Final results synchronize automatically whenever the app loads league data.

## Validation

Database tests cover pick updates, exact kickoff boundaries, non-members, cancelled games, automatic scoring, corrections, ties, partial publication, and weekly versus season points. The local API suite checks sign-in, sportsbook and league percentages, cross-origin requests, private league access, league creation, persistence, partial publication, standings, and commissioner self-removal protection.

### Lint scope

Application code passes `npx oxlint app lib db`. The starter’s full-catalog lint command reports existing errors in unused vendored UI components and hooks; those upstream files were preserved.
