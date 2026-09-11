import type { D1Database } from '@cloudflare/workers-types';

export const SUPER_BOWL_PICK_DEADLINE = Date.parse('2026-10-09T00:15:00Z');

type EspnResponse = {
  events?: Array<{
    name?: string;
    shortName?: string;
    competitions?: Array<{
      status?: { type?: { completed?: boolean } };
      competitors?: Array<{
        winner?: boolean;
        team?: { abbreviation?: string };
      }>;
    }>;
  }>;
};

const appTeam = (team?: string) => (team === 'WSH' ? 'WAS' : team);

export async function syncSuperBowlWinner(db: D1Database) {
  const key = 'super_bowl_winner_2026';
  const saved = await db
    .prepare('SELECT value FROM app_metadata WHERE key=?')
    .bind(key)
    .first<{ value: string }>();
  if (saved?.value) return saved.value;
  if (Date.now() < Date.UTC(2027, 0, 15)) return null;
  try {
    const response = await fetch(
      'https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=3&week=5',
      { cache: 'no-store', headers: { Accept: 'application/json' } },
    );
    if (!response.ok) return null;
    const payload = (await response.json()) as EspnResponse;
    const event = payload.events?.find((item) =>
      /super bowl/i.test(`${item.name ?? ''} ${item.shortName ?? ''}`),
    );
    const competition = event?.competitions?.[0];
    if (!competition?.status?.type?.completed) return null;
    const winner = appTeam(
      competition.competitors?.find((item) => item.winner)?.team?.abbreviation,
    );
    if (!winner) return null;
    await db
      .prepare('INSERT INTO app_metadata(key,value) VALUES(?,?)')
      .bind(key, winner)
      .run();
    return winner;
  } catch (error) {
    console.warn('Super Bowl result is temporarily unavailable.', error);
    return null;
  }
}
