import type { Game } from '@/lib/games';
import type { D1Database } from '@cloudflare/workers-types';

type EspnCompetitor = {
  homeAway?: 'home' | 'away';
  winner?: boolean;
  score?: string;
  team?: { abbreviation?: string };
};

type EspnCompetition = {
  competitors?: EspnCompetitor[];
  status?: {
    type?: { completed?: boolean; name?: string; state?: string };
  };
};

type EspnResponse = {
  events?: Array<{ competitions?: EspnCompetition[] }>;
};

const appTeam = (abbreviation?: string) =>
  abbreviation === 'WSH' ? 'WAS' : abbreviation;

export async function syncLiveResults(
  week: number,
  games: Game[],
  db: D1Database,
) {
  if (!games.length) return false;
  try {
    const response = await fetch(
      `https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=${week}`,
      { cache: 'no-store', headers: { Accept: 'application/json' } },
    );
    if (!response.ok) return false;
    const payload = (await response.json()) as EspnResponse;
    const byMatchup = new Map(
      games.map((game) => [`${game.away}-${game.home}`, game]),
    );
    const updates: ReturnType<D1Database['prepare']>[] = [];
    for (const event of payload.events ?? []) {
      const competition = event.competitions?.[0];
      const away = competition?.competitors?.find(
        (item) => item.homeAway === 'away',
      );
      const home = competition?.competitors?.find(
        (item) => item.homeAway === 'home',
      );
      const game = byMatchup.get(
        `${appTeam(away?.team?.abbreviation)}-${appTeam(home?.team?.abbreviation)}`,
      );
      if (!game) continue;
      const status = competition?.status?.type;
      const cancelled = status?.name === 'STATUS_CANCELED';
      if (!status?.completed && !cancelled) continue;
      const winner = cancelled
        ? null
        : (appTeam(
            competition?.competitors?.find((item) => item.winner)?.team
              ?.abbreviation,
          ) ?? null);
      updates.push(
        db
          .prepare('UPDATE games SET status=?,winner=? WHERE id=?')
          .bind(cancelled ? 'cancelled' : 'final', winner, game.id),
      );
    }
    if (!updates.length) return false;
    await db.batch(updates);
    return true;
  } catch (error) {
    console.warn('Live NFL results are temporarily unavailable.', error);
    return false;
  }
}
