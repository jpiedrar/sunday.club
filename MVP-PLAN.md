# Sunday Club — NFL pick’em MVP

## Product and architecture

A mobile-first private league app: sign in, create or join a league by invite code, select a week, tap a winner for each game, and compare weekly or season standings. A commissioner manages membership and records mock game results. Every correct pick earns one point. Incorrect, missing, tied, or cancelled games earn zero. Equal scores share rank.

Implementation: TypeScript, Tailwind, Next.js-compatible Vinext routes, platform sign-in, and D1 SQL for a self-contained hosted MVP. Separate server data access from UI so Supabase Auth/Postgres can replace the initial adapter. The initial authentication requires a ChatGPT account; email/password Supabase accounts are a migration step, not an implemented capability.

## Data model

Profiles hold identity and display name. Leagues hold name, season, commissioner and a random invite code. Memberships link profiles to leagues. Games hold season/week, two team identifiers, UTC kickoff, status and winner. Picks uniquely link league, user and game. Results remain league-scoped in mock mode so commissioners cannot change another league’s competition.

## Implementation sequence

1. Build the weekly picks surface, with responsive phone navigation, team colors, week selection and clear saved/locked states.
2. Add authenticated profile, league creation/joining, membership checks and SQL persistence.
3. Enforce kickoff locking in the database mutation using server time, and validate that selected winners belong to the matchup.
4. Calculate weekly and season standings from final results; support tied ranks.
5. Add commissioner controls for mock results and member management, guarded server-side.
6. Add a web app manifest, install icons and a conservative service worker. Never cache authenticated API data or allow offline pick writes.
7. Validate authorization, kickoff boundaries, scoring, compilation and deployment.

## Mock schedule and live integration

The mock schedule is explicitly fictional, covers all 32 teams in each seeded week, and includes completed, locked and upcoming examples. Display kickoff in the viewer’s time zone. A provider adapter can later upsert schedules/results using stable provider IDs; it must preserve existing picks, normalize UTC dates, handle postponements, byes, cancellations and result corrections, and never trust browser-reported outcomes.

## Supabase migration

Replace platform identity with Supabase Auth; preserve stable profile IDs through an explicit mapping. Port schema to Postgres and add row-level policies for league membership, self-owned picks and commissioner-only administration. Use a database function/trigger with now() for kickoff locking, and a transaction for league creation plus commissioner membership. Keep service-role credentials server-only. Supply Supabase project settings before enabling that adapter.

## Release scope

Private hosting starts owner-only. Sharing the site with friends is a separate access setting; league invite codes additionally enforce membership within the app. Production live NFL data, push notifications, payments and playoff-specific scoring are outside the MVP.
