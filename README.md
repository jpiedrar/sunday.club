# Sunday Club

A phone-first NFL pick’em MVP with configurable light and dark themes, all 32 team logos, private leagues, one-tap picks that toggle off before kickoff, sportsbook-implied win chances, league pick percentages, server-enforced kickoff locks, automatic NFL results, weekly/monthly/season standings, a dedicated league-picks tab, and commissioner controls. Each game’s picks become visible to the league at kickoff. Published selections backed by 20% or less of the league are labeled as wild picks in the table. Weekly member progress is visible to the full league while anyone remains incomplete. Commissioners can publish a snapshot containing only matchups for which every league member has submitted a pick. When every member completes the full week, the progress panel disappears and all weekly picks become public automatically. Week 1 uses the official 2026 NFL schedule; later weeks are labeled as mock.

## Run locally

Requires Node 22.13+ and npm. Install dependencies with `npm ci`, run `npm run db:local`, then `npm run dev`. Open the printed local URL and choose **Account → Sign in with ChatGPT**. The Sites development adapter creates a local Seedy account without an external login. Create a league, then return to Picks. Week 1 uses the official 2026 NFL schedule and opens by default. Weeks 2–18 remain mock data until a full-season provider is connected.

Run `npm test` for isolated database rule checks. With the local server running, `npm run test:api` verifies the API and creates a local verification league. `npx tsc --noEmit` checks types; `npm run build` produces the Worker and browser assets.

## Stack and boundaries

TypeScript, React, Tailwind 4, Vinext (Next.js-compatible App Router), D1 SQL, and Sites-managed ChatGPT sign-in. This is a working self-contained alternative to the requested preferred Supabase stack; Supabase email/password login and Postgres are not integrated. No external NFL API key is needed. Week 1 market chances are calculated from DraftKings moneylines, with the sportsbook margin removed. The server refreshes them from the ESPN scoreboard feed and uses the latest verified snapshot if that feed is unavailable.

- `app/pick-app.tsx`: mobile interface and account/league/standings views.
- `app/api/club/route.ts`: authenticated API; per-request membership and commissioner checks.
- `db/schema.ts`, `drizzle/`: schema and migration.
- `db/store.ts`: D1 access and idempotent mock-data seeding.
- `lib/games.ts`: fictional 18-week schedule, all 32 teams.
- `lib/odds.ts`: live moneyline lookup, fair-probability calculation, and Week 1 fallback values.
- `lib/results.ts`: automatic final-result synchronization from the NFL scoreboard feed. Previously saved commissioner results remain as a fallback until the live feed supplies an authoritative final.
- `public/manifest.webmanifest`, `sw.js`: installable PWA shell and offline notice. Authenticated pages/data are never cached. Offline pick writes are not queued.

League creation and membership are atomic. Picks are unique per league/player/game. A conditional SQL write checks database UTC time, membership, game status and the selected team at mutation time. Refreshing or altering the phone clock cannot bypass locks. Results are league-scoped in mock mode. Ties, cancellations, wrong picks and missing picks score zero; tied points share rank. Commissioners cannot remove themselves. Removing a member deletes their league picks; rotate the invite code to prevent rejoining.

## Private deployment

The Sites manifest declares D1. Hosting applies committed migrations before publishing. Authentication headers must come from the trusted Sites dispatcher; do not expose the raw Worker to untrusted callers. The initial deployment is owner-only. Site access must be shared with friends before they can use league invitations. Commissioner and league membership checks remain in effect after site sharing.

## Next integration: Supabase and live NFL data

Replace the identity helper with verified Supabase sessions, map profile IDs, translate the schema to Postgres, and enable RLS for memberships and picks. Enforce locks in a Postgres function/trigger using database time. Keep service-role keys server-side. Retain transactional league creation. This requires a Supabase project and its settings.

A future full-season schedule provider should normalize all kickoffs to UTC, retain provider game IDs, idempotently upsert schedule changes, and handle byes and postponements. Week 1 is official; Weeks 2–18 currently use 16 mock games per week. Final results for matching official games synchronize automatically whenever the app loads league data.

## Validation

Database tests cover pick updates, exact kickoff boundaries, non-members, cancelled games, automatic scoring, corrections, ties, partial publication, and weekly versus season points. The local API suite checks sign-in, sportsbook and league percentages, cross-origin requests, private league access, league creation, persistence, partial publication, standings, and commissioner self-removal protection.

### Lint scope

Application code passes `npx oxlint app lib db`. The starter’s full-catalog lint command reports existing errors in unused vendored UI components and hooks; those upstream files were preserved.
